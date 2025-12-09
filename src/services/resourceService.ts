import { pool } from '../db/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { 
  Resource, 
  CreateResourceRequest, 
  UpdateResourceRequest,
  ResourceWithDetails 
} from '../models';

export class ResourceService {
  /**
   * Get all resources with optional filtering
   */
  async getAllResources(filters?: {
    category?: 'formulas' | 'quotes' | 'knowledge' | 'other';
    uploaded_by?: number;
    search?: string;
  }): Promise<ResourceWithDetails[]> {
    let query = `
      SELECT 
        r.*,
        u.username as uploader_name
      FROM Resources r
      LEFT JOIN Users u ON r.uploaded_by = u.user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.category) {
      query += ' AND r.category = ?';
      params.push(filters.category);
    }

    if (filters?.uploaded_by) {
      query += ' AND r.uploaded_by = ?';
      params.push(filters.uploaded_by);
    }

    if (filters?.search) {
      query += ' AND (r.file_name LIKE ? OR r.description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY r.uploaded_on DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as ResourceWithDetails[];
  }

  /**
   * Get resource by ID
   */
  async getResourceById(resourceId: number): Promise<ResourceWithDetails | null> {
    const query = `
      SELECT 
        r.*,
        u.username as uploader_name
      FROM Resources r
      LEFT JOIN Users u ON r.uploaded_by = u.user_id
      WHERE r.resource_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [resourceId]);
    return rows.length > 0 ? (rows[0] as ResourceWithDetails) : null;
  }

  /**
   * Create a new resource with approval logic
   * - Knowledge base: auto-approved
   * - Other categories: pending approval (unless user has permission)
   */
  async createResource(data: CreateResourceRequest, userRole?: string): Promise<Resource> {
    // Determine approval status based on category and user role
    let approvalStatus: 'Approved' | 'Pending' = 'Pending';
    let approvedBy: number | null = null;
    let approvedOn: Date | null = null;

    // Knowledge base resources are auto-approved
    if (data.category === 'knowledge') {
      approvalStatus = 'Approved';
      approvedBy = data.uploaded_by;
      approvedOn = new Date();
    }
    // Admin users can auto-approve their own uploads
    else if (userRole === 'Admin') {
      approvalStatus = 'Approved';
      approvedBy = data.uploaded_by;
      approvedOn = new Date();
    }
    // All other resources require approval
    else {
      approvalStatus = 'Pending';
    }

    const query = `
      INSERT INTO Resources 
      (file_name, file_type, file_size, file_url, category, uploaded_by, description, approval_status, approved_by, approved_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [
      data.file_name,
      data.file_type,
      data.file_size,
      data.file_url,
      data.category,
      data.uploaded_by,
      data.description || null,
      approvalStatus,
      approvedBy,
      approvedOn
    ]);

    const resource = await this.getResourceById(result.insertId);
    return resource as Resource;
  }

  /**
   * Update resource metadata
   */
  async updateResource(
    resourceId: number, 
    data: UpdateResourceRequest
  ): Promise<Resource | null> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.file_name !== undefined) {
      updates.push('file_name = ?');
      params.push(data.file_name);
    }

    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (updates.length === 0) {
      return this.getResourceById(resourceId);
    }

    params.push(resourceId);
    const query = `UPDATE Resources SET ${updates.join(', ')} WHERE resource_id = ?`;

    await pool.query(query, params);
    return this.getResourceById(resourceId);
  }

  /**
   * Delete a resource
   */
  async deleteResource(resourceId: number): Promise<boolean> {
    const query = 'DELETE FROM Resources WHERE resource_id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [resourceId]);
    return result.affectedRows > 0;
  }

  /**
   * Get resources count by category
   */
  async getResourceStats(): Promise<{
    total: number;
    byCategory: { category: string; count: number }[];
  }> {
    const totalQuery = 'SELECT COUNT(*) as total FROM Resources';
    const categoryQuery = `
      SELECT category, COUNT(*) as count 
      FROM Resources 
      GROUP BY category
    `;

    const [totalRows] = await pool.query<RowDataPacket[]>(totalQuery);
    const [categoryRows] = await pool.query<RowDataPacket[]>(categoryQuery);

    return {
      total: totalRows[0].total,
      byCategory: categoryRows as { category: string; count: number }[]
    };
  }

  /**
   * Approve a resource
   */
  async approveResource(resourceId: number, approverId: number): Promise<Resource | null> {
    const query = `
      UPDATE Resources 
      SET approval_status = 'Approved',
          approved_by = ?,
          approved_on = NOW()
      WHERE resource_id = ?
    `;

    await pool.query(query, [approverId, resourceId]);
    return this.getResourceById(resourceId);
  }

  /**
   * Reject a resource
   */
  async rejectResource(resourceId: number, approverId: number): Promise<Resource | null> {
    const query = `
      UPDATE Resources 
      SET approval_status = 'Rejected',
          approved_by = ?,
          approved_on = NOW()
      WHERE resource_id = ?
    `;

    await pool.query(query, [approverId, resourceId]);
    return this.getResourceById(resourceId);
  }

  /**
   * Get pending resources (for approval)
   */
  async getPendingResources(): Promise<ResourceWithDetails[]> {
    const query = `
      SELECT 
        r.*,
        u.username as uploader_name
      FROM Resources r
      LEFT JOIN Users u ON r.uploaded_by = u.user_id
      WHERE r.approval_status = 'Pending'
      ORDER BY r.uploaded_on DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as ResourceWithDetails[];
  }
}
