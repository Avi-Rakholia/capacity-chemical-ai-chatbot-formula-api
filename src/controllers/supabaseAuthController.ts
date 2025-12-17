import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { pool } from '../db/db';
import { syncSupabaseUserWithMySQL, getUserByEmail } from '../services/userSyncService';

/**
 * Register a new user with Supabase Auth
 */
export const registerWithSupabase = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Check if user already exists in MySQL
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || 'user',
          display_name: name
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Sync user to MySQL database
    let userData = null;
    if (data.user) {
      try {
        userData = await syncSupabaseUserWithMySQL(data.user);
        
        if (!userData) {
          return res.status(500).json({
            success: false,
            error: 'Failed to sync user to database'
          });
        }
      } catch (dbError) {
        console.error('Error syncing user to database:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Failed to sync user to database'
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        userData: userData // Complete user data from MySQL for UI
      },
      message: 'User registered successfully'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
};

/**
 * Login user with Supabase Auth
 */
export const loginWithSupabase = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Sync user with MySQL database and get user data
    let userData = null;
    if (data.user) {
      userData = await syncSupabaseUserWithMySQL(data.user);
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        access_token: data.session.access_token,
        userData: userData // Complete user data from MySQL for UI
      },
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
};

/**
 * Logout user (client-side should clear token)
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Sign out from Supabase
      await supabase.auth.signOut();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Logout failed'
    });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Sync user with MySQL database and get user data
    const userData = await syncSupabaseUserWithMySQL(user);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        role: user.user_metadata?.role || user.role,
        userData: userData
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user'
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    res.json({
      success: true,
      data: {
        session: data.session,
        access_token: data.session?.access_token
      }
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Token refresh failed'
    });
  }
};

/**
 * Reset password request
 */
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Password reset failed'
    });
  }
};

/**
 * Update password
 */
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'New password is required'
      });
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Password update failed'
    });
  }
};
