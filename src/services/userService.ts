import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { pool } from '../db/db';
import { 
  User, 
  UserWithRole,
  CreateUserRequest, 
  UpdateUserRequest,
  PaginationParams,
  PaginatedResponse
} from '../models';

export class UserService {
  
  async getAllUsers(params: PaginationParams & { status?: string; role_id?: number }): Promise<PaginatedResponse<UserWithRole>> {
    let { page = 1, limit = 10, sortBy = 'username', sortOrder = 'ASC', status, role_id } = params;
    
    // Map old field name to new field name for backwards compatibility
    if (sortBy === 'name') {
      sortBy = 'username';
    }
    
    // Validate sortBy to prevent SQL injection
    const validSortFields = ['username', 'email', 'status', 'last_login', 'created_on'];
    if (!validSortFields.includes(sortBy)) {
      sortBy = 'username';
    }
    
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams: any[] = [];

    if (status) {
      whereClause += ' WHERE u.status = ?';
      queryParams.push(status);
    }

    if (role_id) {
      whereClause += whereClause ? ' AND u.role_id = ?' : ' WHERE u.role_id = ?';
      queryParams.push(role_id);
    }

    // Count total records
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get paginated data with role information
    // Note: We use template literals for LIMIT/OFFSET as MySQL2 has issues with ? placeholders for these
    const query = `
      SELECT u.*, r.role_name, r.permissions 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id 
      ${whereClause}
      ORDER BY u.${sortBy} ${sortOrder}
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      query,
      queryParams
    );

    return {
      data: rows as UserWithRole[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(id: number): Promise<UserWithRole | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.*, r.role_name, r.permissions 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = ?`,
      [id]
    );

    return rows.length > 0 ? rows[0] as UserWithRole : null;
  }

  async getUserByEmail(email: string): Promise<UserWithRole | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.*, r.role_name, r.permissions 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.email = ?`,
      [email]
    );

    return rows.length > 0 ? rows[0] as UserWithRole : null;
  }

  async createUser(userData: CreateUserRequest & { password?: string }): Promise<User> {
    // Check if email already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password if provided
    let hashedPassword = null;
    if (userData.password) {
      hashedPassword = await bcrypt.hash(userData.password, 10);
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (username, email, password_hash, role_id, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userData.username,
        userData.email,
        hashedPassword,
        userData.role_id,
        userData.status || 'Active'
      ]
    );

    const userId = result.insertId;

    // If password was provided, you might want to store it in a separate auth table
    // For now, we'll just return the created user
    
    const createdUser = await this.getUserById(userId);
    return createdUser as User;
  }

  async updateUser(id: number, updateData: UpdateUserRequest): Promise<User | null> {
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      return null;
    }

    // Check if email is being updated and if it already exists
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.getUserByEmail(updateData.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existingUser;
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`,
      updateValues
    );

    return await this.getUserById(id) as User;
  }

  async deleteUser(id: number): Promise<boolean> {
    // Check if user has associated records (formulas, quotes, etc.)
    const [formulaCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM formulas WHERE created_by = ?',
      [id]
    );

    const [quoteCount] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM quotes WHERE created_by = ?',
      [id]
    );

    if (formulaCount[0].count > 0 || quoteCount[0].count > 0) {
      // Instead of deleting, deactivate the user
      await pool.execute(
        'UPDATE users SET status = ? WHERE user_id = ?',
        ['Inactive', id]
      );
      return true;
    }

    // If no associated records, safe to delete
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE user_id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  async updateLastLogin(id: number): Promise<void> {
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
      [id]
    );
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE role_id = ? AND status = ?',
      [roleId, 'Active']
    );

    return rows as User[];
  }

  async getUsersWithFormulasCount(): Promise<(UserWithRole & { formulas_count: number })[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.*, r.role_name, r.permissions, COUNT(f.formula_id) as formulas_count
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       LEFT JOIN formulas f ON u.user_id = f.created_by
       WHERE u.status = 'Active'
       GROUP BY u.user_id
       ORDER BY u.username`
    );

    return rows as (UserWithRole & { formulas_count: number })[];
  }

  async verifyUserPassword(email: string, password: string): Promise<UserWithRole | null> {
    // This would be used for authentication
    // You'd need to modify your database schema to include password field
    // For now, this is a placeholder
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      return null;
    }

    // In a real implementation, you'd compare the hashed password
    // const isValidPassword = await bcrypt.compare(password, user.password);
    // if (!isValidPassword) {
    //   return null;
    // }

    return user;
  }
}
