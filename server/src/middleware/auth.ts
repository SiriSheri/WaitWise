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
    const dbUser = queryOne<User>(`SELECT id, name, email, role, business_id FROM users WHERE id = ?`, [decoded.id]);
    if (dbUser) {
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        business_id: dbUser.business_id,
      };
    } else {
      req.user = decoded;
    }

    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      const dbUser = queryOne<User>(`SELECT id, name, email, role, business_id FROM users WHERE id = ?`, [decoded.id]);
      if (dbUser) {
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          business_id: dbUser.business_id,
        };
      } else {
        req.user = decoded;
      }
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

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

    next();
  };
}
