import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Check if auth is disabled (for development/testing only)
const AUTH_DISABLED = process.env.DISABLE_AUTH === 'true';

// Mock user for when auth is disabled
const MOCK_USER = {
  id: 'dev-user-id',
  email: 'dev@example.com',
  role: process.env.MOCK_USER_ROLE || 'capacity', // Can be 'capacity', 'nsight', or 'user'
  metadata: {
    role: process.env.MOCK_USER_ROLE || 'capacity',
    full_name: 'Development User'
  }
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
        metadata?: any;
      };
    }
  }
}

// Log auth status on startup
if (AUTH_DISABLED) {
  console.warn('⚠️  WARNING: Authentication is DISABLED! This should only be used in development.');
  console.warn('⚠️  Mock user:', MOCK_USER);
}

/**
 * Middleware to verify Supabase JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Bypass authentication if disabled
  if (AUTH_DISABLED) {
    req.user = MOCK_USER;
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role,
      metadata: user.user_metadata
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Bypass authorization if auth is disabled
    if (AUTH_DISABLED) {
      req.user = req.user || MOCK_USER;
      return next();
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    
    const userRole = req.user.role || 'user';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = authorizeRole(['admin', 'Admin','capacity']);

/**
 * Middleware to check if user is supervisor or admin
 */
export const requireSupervisor = authorizeRole(['admin', 'Admin', 'supervisor', 'Supervisor','capacity']);

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Use mock user if auth is disabled
  if (AUTH_DISABLED) {
    req.user = MOCK_USER;
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email || '',
          role: user.user_metadata?.role,
          metadata: user.user_metadata
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
