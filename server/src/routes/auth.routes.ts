import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { execute, queryOne } from '../db/index.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { User, Business } from '../types/index.js';
import crypto from 'node:crypto';

const router = Router();

// Customer Registration Schema
const customerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

// Staff Registration Schema
const staffRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  business_id: z.string().min(1, 'Please select your organization/facility'),
  job_title: z.string().min(2, 'Job title/role is required'),
  employee_id: z.string().min(2, 'Employee ID or Staff Badge ID is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Customer Registration
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = customerRegisterSchema.parse(req.body);

    const existingUser = queryOne<User>(`SELECT id FROM users WHERE email = ?`, [data.email.toLowerCase()]);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(data.password, 10);
    const nowIso = new Date().toISOString();

    execute(
      `INSERT INTO users (id, name, email, password_hash, role, status, phone, business_id, created_at)
       VALUES (?, ?, ?, ?, 'customer', 'approved', ?, NULL, ?)`,
      [userId, data.name, data.email.toLowerCase(), passwordHash, data.phone || null, nowIso]
    );

    const user = queryOne<User>(
      `SELECT id, name, email, role, status, phone, business_id, created_at FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      res.status(500).json({ error: 'Failed to create user account' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
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

// Staff Registration (Starts in PENDING verification status)
router.post('/staff-register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = staffRegisterSchema.parse(req.body);

    const existingUser = queryOne<User>(`SELECT id FROM users WHERE email = ?`, [data.email.toLowerCase()]);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const biz = queryOne<Business>(`SELECT id, name FROM businesses WHERE id = ?`, [data.business_id]);
    if (!biz) {
      res.status(404).json({ error: 'Selected organization was not found.' });
      return;
    }

    const userId = `usr_staff_${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(data.password, 10);
    const nowIso = new Date().toISOString();

    execute(
      `INSERT INTO users (id, name, email, password_hash, role, status, job_title, employee_id, phone, business_id, created_at)
       VALUES (?, ?, ?, ?, 'staff', 'pending', ?, ?, ?, ?, ?)`,
      [
        userId,
        data.name,
        data.email.toLowerCase(),
        passwordHash,
        data.job_title,
        data.employee_id,
        data.phone || null,
        data.business_id,
        nowIso,
      ]
    );

    const user = queryOne<User>(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.job_title, u.employee_id, u.phone, u.business_id, u.created_at, b.name as business_name
       FROM users u
       LEFT JOIN businesses b ON u.business_id = b.id
       WHERE u.id = ?`,
      [userId]
    );

    res.status(201).json({
      message: 'Staff registration submitted successfully. Your account is awaiting organization verification by an administrator.',
      status: 'pending',
      user,
    });
  } catch (err) {
    next(err);
  }
});

// Login (Enforces status checks for staff accounts)
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = queryOne<User & { business_name?: string }>(
      `SELECT u.*, b.name as business_name
       FROM users u
       LEFT JOIN businesses b ON u.business_id = b.id
       WHERE u.email = ?`,
      [data.email.toLowerCase()]
    );

    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Check account status for staff users
    if (user.role === 'staff') {
      if (user.status === 'pending') {
        res.status(403).json({
          error: 'Your staff account is currently awaiting organization verification by an administrator.',
          status: 'pending',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            business_id: user.business_id,
            business_name: user.business_name,
            job_title: user.job_title,
          },
        });
        return;
      }

      if (user.status === 'rejected') {
        res.status(403).json({
          error: user.rejection_reason
            ? `Your staff verification was rejected: "${user.rejection_reason}"`
            : 'Your staff verification request was rejected. Please contact your organization administrator.',
          status: 'rejected',
          rejection_reason: user.rejection_reason,
        });
        return;
      }

      if (user.status === 'suspended') {
        res.status(403).json({
          error: 'Your staff account has been suspended. Please contact your administrator.',
          status: 'suspended',
        });
        return;
      }
    } else if (user.status === 'suspended') {
      res.status(403).json({
        error: 'Your account has been suspended.',
        status: 'suspended',
      });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
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

  const user = queryOne<User & { business_name?: string }>(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.job_title, u.employee_id, u.phone, u.business_id, u.verified_at, u.rejection_reason, u.created_at, b.name as business_name
     FROM users u
     LEFT JOIN businesses b ON u.business_id = b.id
     WHERE u.id = ?`,
    [req.user.id]
  );

  if (!user) {
    res.status(404).json({ error: 'User account not found' });
    return;
  }

  res.json({ user });
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
