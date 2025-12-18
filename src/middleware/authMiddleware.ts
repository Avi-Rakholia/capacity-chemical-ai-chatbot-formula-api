import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ensureUserSynced } from '../services/userSyncService';

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
        // MySQL user data
        user_id?: number;
        username?: string;
        role_id?: number;
        role_name?: string;
        permissions?: any;
        status?: string;
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

    // Sync user with MySQL and get user data
    const mysqlUserData = await ensureUserSynced(user);

    if (!mysqlUserData) {
      console.error('❌ Failed to sync user with MySQL:', user.email);
      return res.status(500).json({
        success: false,
        error: 'Failed to synchronize user data'
      });
    }

    // Attach user to request with MySQL data
    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role,
      metadata: user.user_metadata,
      // MySQL data
      user_id: mysqlUserData.user_id,
      username: mysqlUserData.username,
      role_id: mysqlUserData.role_id,
      role_name: mysqlUserData.role_name,
      permissions: mysqlUserData.permissions,
      status: mysqlUserData.status
    };

    console.log('🔐 Authenticated user:', {
      email: req.user.email,
      supabase_role: req.user.role,
      mysql_role_name: req.user.role_name,
      user_id: req.user.user_id
    });

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

    // Use MySQL role_name (primary) or fall back to Supabase role
    const userRole = req.user.role_name || req.user.role || 'user';
    
    console.log('🔒 Checking authorization:', {
      user_email: req.user.email,
      user_role: userRole,
      allowed_roles: allowedRoles,
      has_access: allowedRoles.includes(userRole)
    });

    // Normalize role names (handle underscores and spaces)
    const normalizedUserRole = userRole.toLowerCase().replace(/\s+/g, '_');
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase().replace(/\s+/g, '_'));

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      console.warn('❌ Access denied:', {
        user_role: userRole,
        required_roles: allowedRoles
      });
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Required roles: ${allowedRoles.join(', ')}, your role: ${userRole}`
      });
    }

    console.log('✅ Access granted');
    next();
  };
};

/**
 * Middleware to check if user is admin (capacity_admin or nsight_admin)
 */
export const requireAdmin = authorizeRole(['capacity_admin', 'nsight_admin', 'capacity admin', 'nsight admin']);

/**
 * Middleware to check if user is supervisor or admin (same as admin for the 3-role system)
 */
export const requireSupervisor = authorizeRole(['capacity_admin', 'nsight_admin', 'capacity admin', 'nsight admin']);

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
        // Sync user with MySQL and get user data
        const mysqlUserData = await ensureUserSynced(user);
        
        if (mysqlUserData) {
          req.user = {
            id: user.id,
            email: user.email || '',
            role: user.user_metadata?.role,
            metadata: user.user_metadata,
            // MySQL data
            user_id: mysqlUserData.user_id,
            username: mysqlUserData.username,
            role_id: mysqlUserData.role_id,
            role_name: mysqlUserData.role_name,
            permissions: mysqlUserData.permissions,
            status: mysqlUserData.status
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
