import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { queryAll, execute } from '../db/index.js';
import { Notification } from '../types/index.js';

const router = Router();

router.use(authenticateToken);

// Get user notifications
router.get('/', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const notifications = queryAll<Notification>(
    `SELECT * FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 30`,
    [req.user.id]
  );

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  res.json({ notifications, unreadCount });
});

// Mark single notification as read
router.post('/:id/read', (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  execute(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, req.user!.id]);
  res.json({ success: true });
});

// Mark all as read
router.post('/read-all', (req: AuthRequest, res: Response) => {
  execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user!.id]);
  res.json({ success: true });
});

export default router;
