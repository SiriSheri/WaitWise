import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { QueueEngine } from '../services/queueEngine.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { execute, queryOne } from '../db/index.js';
import { Counter } from '../types/index.js';
import { broadcastQueueUpdate } from '../sockets/queueSocket.js';
import crypto from 'node:crypto';

const router = Router();

// All routes require Staff or Admin role
router.use(authenticateToken);
router.use(requireRole(['staff', 'admin']));

// Get full live queue state for staff dashboard
router.get('/queue-state/:businessId', (req: AuthRequest, res: Response) => {
  const businessId = String(req.params.businessId);

  const state = QueueEngine.getBusinessQueueState(businessId);
  if (!state) {
    res.status(404).json({ error: 'Business queue not found' });
    return;
  }

  res.json({ state });
});

// Call next waiting ticket to a counter
const callNextSchema = z.object({
  businessId: z.string(),
  counterId: z.string(),
});

router.post('/call-next', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = callNextSchema.parse(req.body);
    const staffId = req.user!.id;

    const ticket = QueueEngine.callNextTicket({
      businessId: data.businessId,
      counterId: data.counterId,
      staffId,
    });

    if (!ticket) {
      res.json({
        message: 'No customers are currently waiting in line.',
        ticket: null,
      });
      return;
    }

    res.json({
      message: `Called token ${ticket.ticket_number}`,
      ticket,
    });
  } catch (err) {
    next(err);
  }
});

// Update status of a ticket (completed, skipped, serving, cancelled)
const updateStatusSchema = z.object({
  status: z.enum(['serving', 'completed', 'skipped', 'cancelled']),
  notes: z.string().optional(),
});

router.post('/ticket/:id/status', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { status, notes } = updateStatusSchema.parse(req.body);

    const updatedTicket = QueueEngine.updateTicketStatus({
      ticketId: id,
      status,
      notes,
    });

    res.json({
      message: `Ticket updated to ${status}`,
      ticket: updatedTicket,
    });
  } catch (err) {
    next(err);
  }
});

// Create walk-in ticket directly from reception desk
const walkInSchema = z.object({
  businessId: z.string(),
  serviceId: z.string(),
  customerName: z.string().min(2, 'Name is required'),
  customerPhone: z.string().optional(),
  priority: z.number().optional().default(0),
  notes: z.string().optional(),
});

router.post('/walk-in', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = walkInSchema.parse(req.body);

    const ticket = QueueEngine.joinQueue({
      businessId: data.businessId,
      serviceId: data.serviceId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      priority: data.priority,
      notes: data.notes,
      userId: null,
    });

    res.status(201).json({
      message: `Walk-in token ${ticket.ticket_number} created successfully`,
      ticket,
    });
  } catch (err) {
    next(err);
  }
});

// Toggle Pause queue (pause/open)
router.post('/pause-queue', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { businessId, status } = req.body;
    if (!['open', 'paused', 'busy', 'almost_full', 'closed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    execute(`UPDATE businesses SET status = ? WHERE id = ?`, [status, businessId]);

    const state = QueueEngine.getBusinessQueueState(businessId);
    if (state) broadcastQueueUpdate(businessId, state);

    res.json({ message: `Queue status updated to ${status}`, status });
  } catch (err) {
    next(err);
  }
});

// Toggle counter active / inactive
router.post('/counter/toggle', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { counterId, isActive } = req.body;

    const counter = queryOne<Counter>(`SELECT * FROM counters WHERE id = ?`, [counterId]);
    if (!counter) {
      res.status(404).json({ error: 'Counter not found' });
      return;
    }

    execute(`UPDATE counters SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, counterId]);

    const state = QueueEngine.getBusinessQueueState(counter.business_id);
    if (state) broadcastQueueUpdate(counter.business_id, state);

    res.json({ message: `Counter ${counter.name} is now ${isActive ? 'active' : 'inactive'}` });
  } catch (err) {
    next(err);
  }
});

// Create counter
router.post('/counter/create', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { businessId, name } = req.body;
    if (!businessId || !name) {
      res.status(400).json({ error: 'Business ID and Name are required' });
      return;
    }

    const counterId = `cnt_${crypto.randomUUID()}`;
    execute(
      `INSERT INTO counters (id, business_id, name, is_active, current_ticket_id)
       VALUES (?, ?, ?, 1, NULL)`,
      [counterId, businessId, name]
    );

    const state = QueueEngine.getBusinessQueueState(businessId);
    if (state) broadcastQueueUpdate(businessId, state);

    res.status(201).json({ message: 'Counter created successfully', counterId });
  } catch (err) {
    next(err);
  }
});

// Create service
router.post('/service/create', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { businessId, name, description, defaultDurationMins, price } = req.body;
    if (!businessId || !name) {
      res.status(400).json({ error: 'Business ID and Name are required' });
      return;
    }

    const serviceId = `srv_${crypto.randomUUID()}`;
    execute(
      `INSERT INTO services (id, business_id, name, description, default_duration_mins, price, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [serviceId, businessId, name, description || null, defaultDurationMins || 15, price || 0]
    );

    const state = QueueEngine.getBusinessQueueState(businessId);
    if (state) broadcastQueueUpdate(businessId, state);

    res.status(201).json({ message: 'Service created successfully', serviceId });
  } catch (err) {
    next(err);
  }
});

export default router;
