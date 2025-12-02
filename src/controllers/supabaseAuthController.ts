import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { pool } from '../db/db';

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

    // Optionally sync user to MySQL database
    if (data.user) {
      try {
        // Get role_id from role name (default to 3 for regular user)
        let role_id = 3; // Default role
        if (role) {
          const [roles]: any = await pool.query(
            'SELECT role_id FROM roles WHERE role_name = ?',
            [role]
          );
          if (roles.length > 0) {
            role_id = roles[0].role_id;
          }
        }

        // Insert user into MySQL database
        await pool.query(
          'INSERT INTO users (user_id, name, email, role_id, status, created_at) VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE name = ?, email = ?, role_id = ?',
          [data.user.id, name, email, role_id, 'Active', name, email, role_id]
        );
      } catch (dbError) {
        console.error('Error syncing user to database:', dbError);
        // Continue even if database sync fails
      }
    }

    res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session
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

    // Update last_login in MySQL database
    if (data.user) {
      try {
        await pool.query(
          'UPDATE users SET last_login = NOW() WHERE user_id = ? OR email = ?',
          [data.user.id, email]
        );
      } catch (dbError) {
        console.error('Error updating last login:', dbError);
      }
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        access_token: data.session.access_token
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

    // Get additional user data from MySQL database
    let userData = null;
    try {
      const [users]: any = await pool.query(
        `SELECT u.*, r.role_name, r.permissions 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.role_id 
         WHERE u.user_id = ? OR u.email = ?`,
        [user.id, user.email]
      );
      if (users.length > 0) {
        userData = users[0];
      }
    } catch (dbError) {
      console.error('Error fetching user data:', dbError);
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
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
