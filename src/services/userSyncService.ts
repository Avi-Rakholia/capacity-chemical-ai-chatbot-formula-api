import { pool } from '../db/db';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Service to sync Supabase users with MySQL database
 */

interface UserData {
  user_id?: number;
  username: string;
  email: string;
  role_id: number;
  role_name?: string;
  permissions?: any;
  status: string;
  last_login?: Date;
  created_on?: Date;
  updated_on?: Date;
}

/**
 * Get role_id from role name
 */
async function getRoleId(roleName: string): Promise<number> {
  try {
    const [roles]: any = await pool.query(
      'SELECT role_id FROM roles WHERE role_name = ?',
      [roleName]
    );
    
    if (roles.length > 0) {
      return roles[0].role_id;
    }
  } catch (error) {
    console.error('Error fetching role_id:', error);
  }
  
  // Default to regular user role (role_id = 3)
  return 3;
}

/**
 * Extract username from Supabase user data
 */
function extractUsername(supabaseUser: SupabaseUser): string {
  return supabaseUser.user_metadata?.name || 
         supabaseUser.user_metadata?.display_name || 
         supabaseUser.email?.split('@')[0] || 
         'User';
}

/**
 * Extract role from Supabase user data
 */
function extractRole(supabaseUser: SupabaseUser): string {
  return supabaseUser.user_metadata?.role || 
         supabaseUser.role || 
         'user';
}

/**
 * Check if user exists in MySQL database
 */
export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    const [users]: any = await pool.query(
      `SELECT u.*, r.role_name, r.permissions 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.email = ?`,
      [email]
    );
    
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Create new user in MySQL database from Supabase user data
 */
export async function createUserInMySQL(supabaseUser: SupabaseUser): Promise<UserData | null> {
  try {
    const username = extractUsername(supabaseUser);
    const roleName = extractRole(supabaseUser);
    const role_id = await getRoleId(roleName);
    
    // Insert new user
    await pool.query(
      'INSERT INTO users (username, email, role_id, status, created_on) VALUES (?, ?, ?, ?, NOW())',
      [username, supabaseUser.email, role_id, 'Active']
    );
    
    // Fetch and return the newly created user with role info
    return await getUserByEmail(supabaseUser.email!);
  } catch (error) {
    console.error('Error creating user in MySQL:', error);
    throw error;
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(email: string): Promise<void> {
  try {
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE email = ?',
      [email]
    );
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Sync Supabase user with MySQL database
 * Returns user data from MySQL, creating user if necessary
 */
export async function syncSupabaseUserWithMySQL(supabaseUser: SupabaseUser): Promise<UserData | null> {
  try {
    // Check if user exists in MySQL
    let userData = await getUserByEmail(supabaseUser.email!);
    
    if (userData) {
      // User exists - update last_login
      await updateLastLogin(supabaseUser.email!);
    } else {
      // User doesn't exist - create new user
      console.log(`🔄 Syncing new Supabase user to MySQL: ${supabaseUser.email}`);
      userData = await createUserInMySQL(supabaseUser);
    }
    
    return userData;
  } catch (error) {
    console.error('Error syncing user:', error);
    return null;
  }
}

/**
 * Validate and sync user on every request
 * Ensures Supabase and MySQL are always in sync
 */
export async function ensureUserSynced(supabaseUser: SupabaseUser): Promise<UserData | null> {
  return await syncSupabaseUserWithMySQL(supabaseUser);
}
