import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { QueueEngine } from '../services/queueEngine.js';
import { optionalAuth, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { queryAll } from '../db/index.js';
import { QueueEntry } from '../types/index.js';

const router = Router();

const joinQueueSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  priority: z.number().optional().default(0),
});

// Join virtual queue
router.post('/join', optionalAuth, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = joinQueueSchema.parse(req.body);
    const userId = req.user?.id || null;

    const ticket = QueueEngine.joinQueue({
      businessId: data.businessId,
      serviceId: data.serviceId,
      userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      notes: data.notes,
      priority: data.priority,
    });

    res.status(201).json({
      message: 'Successfully joined the queue',
      ticket,
    });
  } catch (err) {
    next(err);
  }
});

// Get live ticket details and position
router.get('/ticket/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);

  const ticket = QueueEngine.getTicketDetails(id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found.' });
    return;
  }

  res.json({ ticket });
});

// Cancel active ticket
router.post('/ticket/:id/cancel', optionalAuth, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const ticket = QueueEngine.getTicketDetails(id);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    if (ticket.status === 'completed' || ticket.status === 'cancelled') {
      res.status(400).json({ error: `Ticket is already marked as ${ticket.status}.` });
      return;
    }

    const updated = QueueEngine.updateTicketStatus({
      ticketId: id,
      status: 'cancelled',
      notes: 'Cancelled by customer',
    });

    res.json({
      message: 'Queue entry cancelled successfully',
      ticket: updated,
    });
  } catch (err) {
    next(err);
  }
});

// Get authenticated user's active tickets
router.get('/user/active', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const rawTickets = queryAll<QueueEntry>(
    `SELECT id FROM queue_entries
     WHERE user_id = ? AND status IN ('waiting', 'called', 'serving')
     ORDER BY joined_at DESC`,
    [req.user.id]
  );

  const activeTickets = rawTickets
    .map((t) => QueueEngine.getTicketDetails(t.id))
    .filter(Boolean);

  res.json({ activeTickets });
});

// Get authenticated user's queue history
router.get('/user/history', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const history = queryAll<QueueEntry>(
    `SELECT q.*, s.name as service_name, b.name as business_name, c.name as counter_name
     FROM queue_entries q
     LEFT JOIN services s ON q.service_id = s.id
     LEFT JOIN businesses b ON q.business_id = b.id
     LEFT JOIN counters c ON q.counter_id = c.id
     WHERE q.user_id = ?
     ORDER BY q.joined_at DESC
     LIMIT 50`,
    [req.user.id]
  );

  res.json({ history });
});

export default router;
