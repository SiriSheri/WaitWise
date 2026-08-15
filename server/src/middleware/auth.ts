import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole, User } from '../types/index.js';
import { queryOne } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'waitwise_super_secure_jwt_secret_dev_key_2026';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please provide a Bearer token.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Cross-verify with authoritative SQLite users table
    const dbUser = queryOne<User>(
      `SELECT id, name, email, role, status, business_id FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (!dbUser) {
      res.status(401).json({ error: 'User account no longer exists.' });
      return;
    }

    if (dbUser.status === 'suspended') {
      res.status(403).json({ error: 'Account has been suspended. Please contact administrator.', status: 'suspended' });
      return;
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      status: dbUser.status,
      business_id: dbUser.business_id,
    };

    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      const dbUser = queryOne<User>(
        `SELECT id, name, email, role, status, business_id FROM users WHERE id = ?`,
        [decoded.id]
      );
      if (dbUser && dbUser.status !== 'suspended') {
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          status: dbUser.status,
          business_id: dbUser.business_id,
        };
      }
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

/**
 * Role-Based Access Control Middleware
 */
export function requireRole(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Forbidden: requires one of the following roles: [${roles.join(', ')}]` });
      return;
    }

    if (req.user.role === 'staff' && req.user.status !== 'approved') {
      res.status(403).json({
        error: `Staff account is not approved. Current status: ${req.user.status}`,
        status: req.user.status,
      });
      return;
    }

    next();
  };
}

/**
 * Organization / Tenant Isolation Middleware
 * Ensures staff members can only access and modify their assigned organization.
 * System admins bypass this check to manage any organization.
 */
export function requireOrganizationAccess(getBusinessId: (req: AuthRequest) => string | undefined) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // Admins have platform-wide access
    if (req.user.role === 'admin') {
      next();
      return;
    }

    const targetBusinessId = getBusinessId(req);
    if (!targetBusinessId) {
      res.status(400).json({ error: 'Business ID is required for this operation.' });
      return;
    }

    if (req.user.business_id !== targetBusinessId) {
      res.status(403).json({
        error: 'Forbidden: You are only authorized to manage queues for your assigned organization.',
      });
      return;
    }

    next();
  };
}
