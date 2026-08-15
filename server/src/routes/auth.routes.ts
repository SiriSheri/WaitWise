import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { execute, queryOne } from '../db/index.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { User } from '../types/index.js';
import crypto from 'node:crypto';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['customer', 'staff', 'admin']).default('customer'),
  business_id: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = queryOne<User>(`SELECT id FROM users WHERE email = ?`, [data.email.toLowerCase()]);
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(data.password, 10);
    const nowIso = new Date().toISOString();

    execute(
      `INSERT INTO users (id, name, email, password_hash, role, phone, business_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.name, data.email.toLowerCase(), passwordHash, data.role, data.phone || null, data.business_id || null, nowIso]
    );

    const user = queryOne<User>(`SELECT id, name, email, role, phone, business_id, created_at FROM users WHERE id = ?`, [userId]);
    if (!user) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      business_id: user.business_id,
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = queryOne<User>(`SELECT * FROM users WHERE email = ?`, [data.email.toLowerCase()]);
    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      business_id: user.business_id,
    });

    const { password_hash, ...userProfile } = user;

    res.json({
      message: 'Logged in successfully',
      token,
      user: userProfile,
    });
  } catch (err) {
    next(err);
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = queryOne<User>(
    `SELECT id, name, email, role, phone, business_id, created_at FROM users WHERE id = ?`,
    [req.user.id]
  );

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

export default router;
