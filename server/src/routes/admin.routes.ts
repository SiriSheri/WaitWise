import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { queryAll, queryOne, execute } from '../db/index.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { User } from '../types/index.js';

const router = Router();

// All admin routes require Admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get Staff Verification Requests & Stats
router.get('/verifications', (req: AuthRequest, res: Response) => {
  const { status, businessId } = req.query;

  let query = `
    SELECT u.id, u.name, u.email, u.role, u.status, u.job_title, u.employee_id, u.phone,
           u.business_id, u.verified_at, u.verified_by, u.rejection_reason, u.created_at,
           b.name as business_name, b.category as business_category,
           v.name as verified_by_name
    FROM users u
    LEFT JOIN businesses b ON u.business_id = b.id
    LEFT JOIN users v ON u.verified_by = v.id
    WHERE u.role = 'staff'
  `;

  const params: any[] = [];

  if (status && status !== 'all') {
    query += ` AND u.status = ?`;
    params.push(String(status));
  }

  if (businessId && businessId !== 'all') {
    query += ` AND u.business_id = ?`;
    params.push(String(businessId));
  }

  query += ` ORDER BY u.created_at DESC`;

  const staffList = queryAll<any>(query, params);

  // Verification counts summary
  const statsRows = queryAll<{ status: string; count: number }>(`
    SELECT status, COUNT(*) as count FROM users WHERE role = 'staff' GROUP BY status
  `);

  const summary = {
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
    total: 0,
  };

  for (const row of statsRows) {
    if (row.status in summary) {
      (summary as any)[row.status] = row.count;
    }
    summary.total += row.count;
  }

  res.json({ staff: staffList, summary });
});

// Approve Staff Verification Request
router.post('/verifications/:id/approve', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const adminId = req.user!.id;

    const user = queryOne<User>(`SELECT * FROM users WHERE id = ? AND role = 'staff'`, [userId]);
    if (!user) {
      res.status(404).json({ error: 'Staff account not found' });
      return;
    }

    const nowIso = new Date().toISOString();

    execute(
      `UPDATE users
       SET status = 'approved', verified_at = ?, verified_by = ?, rejection_reason = NULL
       WHERE id = ?`,
      [nowIso, adminId, userId]
    );

    const updatedUser = queryOne<User>(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.job_title, u.employee_id, u.phone, u.business_id, u.verified_at, b.name as business_name
       FROM users u
       LEFT JOIN businesses b ON u.business_id = b.id
       WHERE u.id = ?`,
      [userId]
    );

    res.json({
      message: `Staff member ${user.name} has been approved and granted counter access.`,
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
});

// Reject Staff Verification Request
const rejectSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required (min 3 characters)'),
});

router.post('/verifications/:id/reject', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const adminId = req.user!.id;
    const { reason } = rejectSchema.parse(req.body);

    const user = queryOne<User>(`SELECT * FROM users WHERE id = ? AND role = 'staff'`, [userId]);
    if (!user) {
      res.status(404).json({ error: 'Staff account not found' });
      return;
    }

    const nowIso = new Date().toISOString();

    execute(
      `UPDATE users
       SET status = 'rejected', verified_at = ?, verified_by = ?, rejection_reason = ?
       WHERE id = ?`,
      [nowIso, adminId, reason, userId]
    );

    res.json({
      message: `Staff verification for ${user.name} has been rejected.`,
      rejection_reason: reason,
    });
  } catch (err) {
    next(err);
  }
});

// Suspend Staff Account
router.post('/verifications/:id/suspend', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);

    const user = queryOne<User>(`SELECT * FROM users WHERE id = ? AND role = 'staff'`, [userId]);
    if (!user) {
      res.status(404).json({ error: 'Staff account not found' });
      return;
    }

    execute(`UPDATE users SET status = 'suspended' WHERE id = ?`, [userId]);

    res.json({
      message: `Staff account for ${user.name} has been suspended. Access revoked.`,
    });
  } catch (err) {
    next(err);
  }
});

// Reactivate Staff Account
router.post('/verifications/:id/reactivate', (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.id);
    const adminId = req.user!.id;

    const user = queryOne<User>(`SELECT * FROM users WHERE id = ? AND role = 'staff'`, [userId]);
    if (!user) {
      res.status(404).json({ error: 'Staff account not found' });
      return;
    }

    const nowIso = new Date().toISOString();

    execute(
      `UPDATE users
       SET status = 'approved', verified_at = ?, verified_by = ?, rejection_reason = NULL
       WHERE id = ?`,
      [nowIso, adminId, userId]
    );

    res.json({
      message: `Staff account for ${user.name} has been reactivated successfully.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
