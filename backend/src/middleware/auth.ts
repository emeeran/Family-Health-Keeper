import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { User } from '../types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password_hash'>;
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Get user from database
    const userQuery = `
      SELECT id, email, username, first_name, last_name, role, avatar_url,
             is_active, email_verified, created_at, updated_at, last_login
      FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result = await query(userQuery, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    const user = result.rows[0] as Omit<User, 'password_hash'>;

    // Check if session is still valid
    const sessionQuery = `
      SELECT id FROM sessions
      WHERE user_id = $1 AND token = $2 AND expires_at > NOW() AND is_active = true
    `;

    const sessionResult = await query(sessionQuery, [user.id, token]);

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid'
      });
    }

    // Attach user to request
    req.user = user;

    logger.debug('User authenticated', { userId: user.id, email: user.email });
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = requireRole('admin');

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);

    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      const userQuery = `
        SELECT id, email, username, first_name, last_name, role, avatar_url,
               is_active, email_verified, created_at, updated_at, last_login
        FROM users
        WHERE id = $1 AND is_active = true
      `;

      const result = await query(userQuery, [decoded.userId]);

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }

    next();
  } catch (error) {
    // Optional auth should not fail the request
    logger.debug('Optional authentication failed:', error);
    next();
  }
};

// Helper function to extract token from request
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check for token in cookies
  const token = req.cookies?.token;
  if (token) {
    return token;
  }

  return null;
}

// Generate JWT token
export const generateToken = (user: Omit<User, 'password_hash'>): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, jwtSecret, { expiresIn: expiresIn });
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
    const decoded = jwt.verify(refreshToken, jwtSecret) as JWTPayload;

    // Get user and validate session
    const userQuery = `
      SELECT id, email, username, first_name, last_name, role, avatar_url,
             is_active, email_verified, created_at, updated_at, last_login
      FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result = await query(userQuery, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    const user = result.rows[0];

    // Generate new token
    const newToken = generateToken(user);

    res.json({
      success: true,
      token: newToken,
      user
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
};