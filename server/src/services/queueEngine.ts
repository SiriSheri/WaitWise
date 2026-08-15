import { execute, queryAll, queryOne } from '../db/index.js';
import {
  Business,
  Counter,
  QueueEntry,
  QueueState,
  QueueStatus,
  Service,
} from '../types/index.js';
import { WaitTimeCalculator } from './waitTimeCalculator.js';
import { broadcastQueueUpdate, broadcastTicketCalled, sendNotificationToUser } from '../sockets/queueSocket.js';
import crypto from 'node:crypto';

export class QueueEngine {
  /**
   * Generates a clean, readable token number (e.g. MGH-105)
   */
  static generateTicketNumber(businessId: string): string {
    const biz = queryOne<{ name: string; category: string }>(
      `SELECT name, category FROM businesses WHERE id = ?`,
      [businessId]
    );

    let prefix = 'WW';
    if (biz) {
      // Create prefix from business initials or category
      const words = biz.name.split(' ');
      if (words.length >= 2) {
        prefix = words.map((w) => w[0].toUpperCase()).slice(0, 3).join('');
      } else {
        prefix = biz.category.slice(0, 3).toUpperCase();
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const countRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM queue_entries
       WHERE business_id = ? AND joined_at >= ?`,
      [businessId, todayStart.toISOString()]
    );

    const nextSeq = (countRow?.count || 0) + 101;
    return `${prefix}-${nextSeq}`;
  }

  /**
   * Retrieves full real-time state of a business queue
   */
  static getBusinessQueueState(businessId: string): QueueState | null {
    const business = queryOne<Business>(
      `SELECT * FROM businesses WHERE id = ?`,
      [businessId]
    );

    if (!business) return null;

    const services = queryAll<Service>(
      `SELECT * FROM services WHERE business_id = ? AND is_active = 1`,
      [businessId]
    );

    const counters = queryAll<Counter>(
      `SELECT c.*, u.name as staff_name, q.ticket_number as current_ticket_number, q.customer_name as current_customer_name
       FROM counters c
       LEFT JOIN users u ON c.staff_id = u.id
       LEFT JOIN queue_entries q ON c.current_ticket_id = q.id
       WHERE c.business_id = ?`,
      [businessId]
    );

    const activeCountersCount = Math.max(
      1,
      counters.filter((c) => c.is_active === 1).length
    );

    const rawWaiting = queryAll<QueueEntry>(
      `SELECT q.*, s.name as service_name, c.name as counter_name
       FROM queue_entries q
       LEFT JOIN services s ON q.service_id = s.id
       LEFT JOIN counters c ON q.counter_id = c.id
       WHERE q.business_id = ? AND q.status = 'waiting'
       ORDER BY q.priority DESC, q.joined_at ASC`,
      [businessId]
    );

    // Compute live positions, people ahead, and updated ETAs
    let delayCount = 0;
    const waitingQueue = rawWaiting.map((entry, index) => {
      const position = index + 1;
      const peopleAhead = index;
      const liveEta = WaitTimeCalculator.calculateDynamicETA({
        businessId,
        serviceId: entry.service_id,
        positionAhead: peopleAhead,
        activeCounters: activeCountersCount,
      });

      const isExcessive = WaitTimeCalculator.isExcessiveDelay(entry.joined_at, entry.estimated_wait_mins);
      if (isExcessive) delayCount++;

      return {
        ...entry,
        position,
        people_ahead: peopleAhead,
        estimated_wait_mins: liveEta,
        is_excessive_wait: isExcessive,
      };
    });

    const currentlyServing = queryAll<QueueEntry>(
      `SELECT q.*, s.name as service_name, c.name as counter_name
       FROM queue_entries q
       LEFT JOIN services s ON q.service_id = s.id
       LEFT JOIN counters c ON q.counter_id = c.id
       WHERE q.business_id = ? AND q.status IN ('serving', 'called')
       ORDER BY q.called_at DESC`,
      [businessId]
    );

    const recentlyCompleted = queryAll<QueueEntry>(
      `SELECT q.*, s.name as service_name, c.name as counter_name
       FROM queue_entries q
       LEFT JOIN services s ON q.service_id = s.id
       LEFT JOIN counters c ON q.counter_id = c.id
       WHERE q.business_id = ? AND q.status IN ('completed', 'skipped', 'cancelled')
       ORDER BY COALESCE(q.completed_at, q.joined_at) DESC
       LIMIT 15`,
      [businessId]
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const servedTodayRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM queue_entries
       WHERE business_id = ? AND status = 'completed' AND completed_at >= ?`,
      [businessId, todayStart.toISOString()]
    );

    const rollingAvgWait = WaitTimeCalculator.getRollingAverageServiceMins(businessId);

    const queueState: QueueState = {
      business: {
        ...business,
        waiting_count: waitingQueue.length,
        serving_count: currentlyServing.length,
        current_token: currentlyServing[0]?.ticket_number || null,
        estimated_wait_mins: waitingQueue[0]?.estimated_wait_mins || 0,
      },
      services,
      counters,
      activeCountersCount,
      waitingQueue,
      currentlyServing,
      recentlyCompleted,
      stats: {
        totalWaiting: waitingQueue.length,
        totalServing: currentlyServing.length,
        totalServedToday: servedTodayRow?.count || 0,
        avgWaitMins: rollingAvgWait,
        avgServiceMins: rollingAvgWait,
        isExcessiveDelayDetected: delayCount > 0,
      },
    };

    return queueState;
  }

  /**
   * User or walk-in customer joins virtual queue
   */
  static joinQueue(data: {
    businessId: string;
    serviceId: string;
    userId?: string | null;
    customerName: string;
    customerPhone?: string | null;
    notes?: string | null;
    priority?: number;
  }): QueueEntry {
    const { businessId, serviceId, userId, customerName, customerPhone, notes, priority = 0 } = data;

    const biz = queryOne<Business>(`SELECT * FROM businesses WHERE id = ?`, [businessId]);
    if (!biz) throw new Error('Business not found');

    if (biz.status === 'closed') {
      throw new Error('This location is currently closed.');
    }
    if (biz.status === 'paused') {
      throw new Error('This location has temporarily paused accepting new queue entries.');
    }

    const currentWaitRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM queue_entries WHERE business_id = ? AND status = 'waiting'`,
      [businessId]
    );
    const waitingCount = currentWaitRow?.count || 0;

    if (waitingCount >= (biz.max_capacity || 100)) {
      throw new Error('Queue is currently at maximum capacity. Please check back shortly.');
    }

    const activeCountersRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM counters WHERE business_id = ? AND is_active = 1`,
      [businessId]
    );
    const activeCounters = Math.max(1, activeCountersRow?.count || 1);

    const initialEta = WaitTimeCalculator.calculateDynamicETA({
      businessId,
      serviceId,
      positionAhead: waitingCount,
      activeCounters,
    });

    const ticketId = `tkt_${crypto.randomUUID()}`;
    const ticketNumber = this.generateTicketNumber(businessId);
    const joinedAt = new Date().toISOString();

    execute(
      `INSERT INTO queue_entries (id, ticket_number, business_id, service_id, user_id, counter_id, customer_name, customer_phone, status, priority, notes, estimated_wait_mins, joined_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?, 'waiting', ?, ?, ?, ?)`,
      [ticketId, ticketNumber, businessId, serviceId, userId || null, customerName, customerPhone || null, priority, notes || null, initialEta, joinedAt]
    );

    // Create confirmation notification for registered user
    if (userId) {
      const notifId = `notif_${crypto.randomUUID()}`;
      execute(
        `INSERT INTO notifications (id, user_id, ticket_id, type, title, message, is_read, created_at)
         VALUES (?, ?, ?, 'info', ?, ?, 0, ?)`,
        [
          notifId,
          userId,
          ticketId,
          `Queue Joined: ${ticketNumber}`,
          `You joined the queue at ${biz.name}. Your estimated wait is ~${initialEta} mins.`,
          joinedAt,
        ]
      );
    }

    // Broadcast live update
    const updatedState = this.getBusinessQueueState(businessId);
    if (updatedState) {
      broadcastQueueUpdate(businessId, updatedState);
    }

    const createdTicket = this.getTicketDetails(ticketId);
    if (!createdTicket) throw new Error('Failed to retrieve created ticket');
    return createdTicket;
  }

  /**
   * Retrieves single ticket live details with computed position
   */
  static getTicketDetails(ticketId: string): QueueEntry | null {
    const ticket = queryOne<QueueEntry>(
      `SELECT q.*, s.name as service_name, c.name as counter_name, b.name as business_name
       FROM queue_entries q
       LEFT JOIN services s ON q.service_id = s.id
       LEFT JOIN counters c ON q.counter_id = c.id
       LEFT JOIN businesses b ON q.business_id = b.id
       WHERE q.id = ?`,
      [ticketId]
    );

    if (!ticket) return null;

    if (ticket.status === 'waiting') {
      const aheadRow = queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM queue_entries
         WHERE business_id = ? AND status = 'waiting'
           AND (priority > ? OR (priority = ? AND joined_at < ?))`,
        [ticket.business_id, ticket.priority, ticket.priority, ticket.joined_at]
      );

      const peopleAhead = aheadRow?.count || 0;
      const position = peopleAhead + 1;

      const activeCountersRow = queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM counters WHERE business_id = ? AND is_active = 1`,
        [ticket.business_id]
      );
      const activeCounters = Math.max(1, activeCountersRow?.count || 1);

      const liveEta = WaitTimeCalculator.calculateDynamicETA({
        businessId: ticket.business_id,
        serviceId: ticket.service_id,
        positionAhead: peopleAhead,
        activeCounters,
      });

      const isExcessive = WaitTimeCalculator.isExcessiveDelay(ticket.joined_at, ticket.estimated_wait_mins);

      return {
        ...ticket,
        position,
        people_ahead: peopleAhead,
        estimated_wait_mins: liveEta,
        is_excessive_wait: isExcessive,
      };
    }

    return {
      ...ticket,
      position: 0,
      people_ahead: 0,
    };
  }

  /**
   * Staff calls next ticket to a counter
   */
  static callNextTicket(data: {
    businessId: string;
    counterId: string;
    staffId: string;
  }): QueueEntry | null {
    const { businessId, counterId, staffId } = data;

    const counter = queryOne<Counter>(
      `SELECT * FROM counters WHERE id = ? AND business_id = ?`,
      [counterId, businessId]
    );
    if (!counter) throw new Error('Counter not found');

    // If counter currently has a ticket in serving, auto-complete it
    if (counter.current_ticket_id) {
      this.updateTicketStatus({
        ticketId: counter.current_ticket_id,
        status: 'completed',
        notes: 'Auto-completed upon next call',
      });
    }

    // Find next ticket in waiting
    const nextTicket = queryOne<QueueEntry>(
      `SELECT * FROM queue_entries
       WHERE business_id = ? AND status = 'waiting'
       ORDER BY priority DESC, joined_at ASC
       LIMIT 1`,
      [businessId]
    );

    if (!nextTicket) {
      execute(`UPDATE counters SET current_ticket_id = NULL WHERE id = ?`, [counterId]);
      const state = this.getBusinessQueueState(businessId);
      if (state) broadcastQueueUpdate(businessId, state);
      return null;
    }

    const nowIso = new Date().toISOString();
    const joinedMs = new Date(nextTicket.joined_at).getTime();
    const actualWaitMins = Math.max(1, Math.round((Date.now() - joinedMs) / (60 * 1000)));

    // Update ticket to serving
    execute(
      `UPDATE queue_entries
       SET status = 'serving', counter_id = ?, called_at = ?, served_at = ?, actual_wait_mins = ?
       WHERE id = ?`,
      [counterId, nowIso, nowIso, actualWaitMins, nextTicket.id]
    );

    // Link ticket to counter
    execute(
      `UPDATE counters SET current_ticket_id = ?, staff_id = ? WHERE id = ?`,
      [nextTicket.id, staffId, counterId]
    );

    // Notify user if ticket belongs to a registered account
    if (nextTicket.user_id) {
      const notifId = `notif_${crypto.randomUUID()}`;
      execute(
        `INSERT INTO notifications (id, user_id, ticket_id, type, title, message, is_read, created_at)
         VALUES (?, ?, ?, 'turn_now', ?, ?, 0, ?)`,
        [
          notifId,
          nextTicket.user_id,
          nextTicket.id,
          `It's Your Turn! Token ${nextTicket.ticket_number}`,
          `Please proceed immediately to ${counter.name}.`,
          nowIso,
        ]
      );
    }

    // Broadcast sound alert + queue update
    broadcastTicketCalled(businessId, {
      ticketId: nextTicket.id,
      ticketNumber: nextTicket.ticket_number,
      customerName: nextTicket.customer_name,
      counterName: counter.name,
    });

    const updatedState = this.getBusinessQueueState(businessId);
    if (updatedState) {
      broadcastQueueUpdate(businessId, updatedState);
    }

    return this.getTicketDetails(nextTicket.id);
  }

  /**
   * Updates status of a ticket (completed, skipped, cancelled, etc.)
   */
  static updateTicketStatus(data: {
    ticketId: string;
    status: QueueStatus;
    notes?: string;
  }): QueueEntry {
    const { ticketId, status, notes } = data;

    const ticket = queryOne<QueueEntry>(`SELECT * FROM queue_entries WHERE id = ?`, [ticketId]);
    if (!ticket) throw new Error('Ticket not found');

    const nowIso = new Date().toISOString();

    if (status === 'completed') {
      execute(
        `UPDATE queue_entries
         SET status = 'completed', completed_at = ?, notes = COALESCE(?, notes)
         WHERE id = ?`,
        [nowIso, notes || null, ticketId]
      );

      // If counter was serving this ticket, free the counter
      if (ticket.counter_id) {
        execute(
          `UPDATE counters SET current_ticket_id = NULL WHERE id = ? AND current_ticket_id = ?`,
          [ticket.counter_id, ticketId]
        );
      }
    } else if (status === 'skipped' || status === 'cancelled') {
      execute(
        `UPDATE queue_entries
         SET status = ?, completed_at = ?, notes = COALESCE(?, notes)
         WHERE id = ?`,
        [status, nowIso, notes || null, ticketId]
      );

      if (ticket.counter_id) {
        execute(
          `UPDATE counters SET current_ticket_id = NULL WHERE id = ? AND current_ticket_id = ?`,
          [ticket.counter_id, ticketId]
        );
      }
    } else if (status === 'serving') {
      execute(
        `UPDATE queue_entries
         SET status = 'serving', served_at = COALESCE(served_at, ?)
         WHERE id = ?`,
        [nowIso, ticketId]
      );
    }

    const updatedState = this.getBusinessQueueState(ticket.business_id);
    if (updatedState) {
      broadcastQueueUpdate(ticket.business_id, updatedState);
    }

    const result = this.getTicketDetails(ticketId);
    if (!result) throw new Error('Failed to load updated ticket');
    return result;
  }
}
