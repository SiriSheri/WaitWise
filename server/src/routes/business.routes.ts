import { Router, Request, Response, NextFunction } from 'express';
import { queryAll, queryOne, execute } from '../db/index.js';
import { Business } from '../types/index.js';
import { WaitTimeCalculator } from '../services/waitTimeCalculator.js';
import { QueueEngine } from '../services/queueEngine.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// List all businesses with search, filters, and dynamic wait times
router.get('/', (req: Request, res: Response) => {
  const { category, search, city, status } = req.query;

  let query = `SELECT * FROM businesses WHERE 1=1`;
  const params: any[] = [];

  if (category && category !== 'all') {
    query += ` AND category = ?`;
    params.push(String(category));
  }

  if (status && status !== 'all') {
    query += ` AND status = ?`;
    params.push(String(status));
  }

  if (city) {
    query += ` AND city LIKE ?`;
    params.push(`%${String(city)}%`);
  }

  if (search) {
    query += ` AND (name LIKE ? OR description LIKE ? OR address LIKE ?)`;
    const searchStr = `%${String(search)}%`;
    params.push(searchStr, searchStr, searchStr);
  }

  query += ` ORDER BY name ASC`;

  const businesses = queryAll<Business>(query, params);

  // Augment with real-time queue summaries
  const augmented = businesses.map((b) => {
    const waitCountRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM queue_entries WHERE business_id = ? AND status = 'waiting'`,
      [b.id]
    );
    const servingRow = queryOne<{ ticket_number: string }>(
      `SELECT ticket_number FROM queue_entries WHERE business_id = ? AND status = 'serving' ORDER BY called_at DESC LIMIT 1`,
      [b.id]
    );

    const activeCountersRow = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM counters WHERE business_id = ? AND is_active = 1`,
      [b.id]
    );
    const activeCounters = Math.max(1, activeCountersRow?.count || 1);
    const waitingCount = waitCountRow?.count || 0;

    const estimatedWait = WaitTimeCalculator.calculateDynamicETA({
      businessId: b.id,
      positionAhead: waitingCount,
      activeCounters,
    });

    return {
      ...b,
      waiting_count: waitingCount,
      current_token: servingRow?.ticket_number || null,
      estimated_wait_mins: waitingCount > 0 ? estimatedWait : 0,
    };
  });

  res.json({ businesses: augmented });
});

// Get business details by ID
router.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);

  const state = QueueEngine.getBusinessQueueState(id);
  if (!state) {
    res.status(404).json({ error: 'Business location not found.' });
    return;
  }

  const smartInsights = WaitTimeCalculator.getSmartInsights(id);

  res.json({
    business: state.business,
    services: state.services,
    counters: state.counters,
    stats: state.stats,
    insights: smartInsights,
  });
});

// Get historical stats & peak hours analysis
router.get('/:id/stats', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const insights = WaitTimeCalculator.getSmartInsights(id);
  res.json({ insights });
});

// Update business settings (Staff / Admin only)
router.put('/:id', authenticateToken, requireRole(['staff', 'admin']), (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { name, description, address, phone, operating_hours, status, max_capacity, avg_service_time_mins } = req.body;

    const existing = queryOne<Business>(`SELECT * FROM businesses WHERE id = ?`, [id]);
    if (!existing) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    // If staff, verify they belong to this business
    if (req.user?.role === 'staff' && req.user.business_id !== id) {
      res.status(403).json({ error: 'You are not authorized to modify this business.' });
      return;
    }

    execute(
      `UPDATE businesses
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           address = COALESCE(?, address),
           phone = COALESCE(?, phone),
           operating_hours = COALESCE(?, operating_hours),
           status = COALESCE(?, status),
           max_capacity = COALESCE(?, max_capacity),
           avg_service_time_mins = COALESCE(?, avg_service_time_mins)
       WHERE id = ?`,
      [
        name,
        description,
        address,
        phone,
        typeof operating_hours === 'object' ? JSON.stringify(operating_hours) : operating_hours,
        status,
        max_capacity,
        avg_service_time_mins,
        id,
      ]
    );

    const updated = QueueEngine.getBusinessQueueState(id);
    res.json({ message: 'Business settings updated', business: updated?.business });
  } catch (err) {
    next(err);
  }
});

export default router;
