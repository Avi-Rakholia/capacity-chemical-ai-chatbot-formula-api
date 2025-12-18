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
   * Only returns approved resources (pending resources shown only in approval screen)
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
      FROM resources r
      LEFT JOIN users u ON r.uploaded_by = u.user_id
      WHERE r.approval_status = 'Approved'
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
      FROM resources r
      LEFT JOIN users u ON r.uploaded_by = u.user_id
      WHERE r.resource_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [resourceId]);
    return rows.length > 0 ? (rows[0] as ResourceWithDetails) : null;
  }

  /**
   * Create a new resource with approval logic
   * - Admin uploads: auto-approved
   * - Knowledge base: auto-approved
   * - Regular user formulas/quotes: pending approval (creates approval record)
   */
  async createResource(data: CreateResourceRequest, userRole?: string): Promise<Resource> {
    // Determine approval status based on user role
    let approvalStatus: 'Approved' | 'Pending' = 'Pending';
    let approvedBy: number | null = null;
    let approvedOn: Date | null = null;

    // Admin users can auto-approve their own uploads
    if (userRole === 'capacity_admin' || userRole === 'nsight_admin') {
      approvalStatus = 'Approved';
      approvedBy = data.uploaded_by;
      approvedOn = new Date();
    }
    // Knowledge base resources are also auto-approved
    else if (data.category === 'knowledge') {
      approvalStatus = 'Approved';
      approvedBy = data.uploaded_by;
      approvedOn = new Date();
    }
    // Regular users need approval for formulas and quotes
    else {
      approvalStatus = 'Pending';
    }

    const query = `
      INSERT INTO resources 
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

    const resourceId = result.insertId;

    // If approval is pending, create an approval record in the approvals table
    if (approvalStatus === 'Pending') {
      const approvalQuery = `
        INSERT INTO approvals (entity_type, entity_id, approver_id, decision, comments)
        VALUES ('Resource', ?, ?, 'Pending', ?)
      `;
      
      // Use the uploader's ID as placeholder for approver_id (will be updated when admin actually approves)
      // This satisfies the foreign key constraint while keeping the record in pending state
      await pool.query(approvalQuery, [
        resourceId,
        data.uploaded_by, // Use uploader ID to satisfy foreign key - will be updated when admin approves/rejects
        `Resource upload pending approval: ${data.file_name}`
      ]);
    }

    const resource = await this.getResourceById(resourceId);
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
    const query = `UPDATE resources SET ${updates.join(', ')} WHERE resource_id = ?`;

    await pool.query(query, params);
    return this.getResourceById(resourceId);
  }

  /**
   * Delete a resource
   */
  async deleteResource(resourceId: number): Promise<boolean> {
    const query = 'DELETE FROM resources WHERE resource_id = ?';
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
    const totalQuery = 'SELECT COUNT(*) as total FROM resources';
    const categoryQuery = `
      SELECT category, COUNT(*) as count 
      FROM resources 
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
    // Update resource approval status
    const query = `
      UPDATE resources 
      SET approval_status = 'Approved',
          approved_by = ?,
          approved_on = NOW()
      WHERE resource_id = ?
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [approverId, resourceId]);
    console.log(`✅ Resource ${resourceId} approval status updated. Rows affected: ${result.affectedRows}`);

    // Update the approvals table
    const approvalQuery = `
      UPDATE approvals 
      SET decision = 'Approved',
          approver_id = ?,
          decision_date = NOW()
      WHERE entity_type = 'Resource' AND entity_id = ? AND decision = 'Pending'
    `;

    const [approvalResult] = await pool.query<ResultSetHeader>(approvalQuery, [approverId, resourceId]);
    console.log(`✅ Approvals table updated for resource ${resourceId}. Rows affected: ${approvalResult.affectedRows}`);

    return this.getResourceById(resourceId);
  }

  /**
   * Reject a resource
   */
  async rejectResource(resourceId: number, approverId: number): Promise<Resource | null> {
    // Update resource approval status
    const query = `
      UPDATE resources 
      SET approval_status = 'Rejected',
          approved_by = ?,
          approved_on = NOW()
      WHERE resource_id = ?
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [approverId, resourceId]);
    console.log(`❌ Resource ${resourceId} rejection status updated. Rows affected: ${result.affectedRows}`);

    // Update the approvals table
    const approvalQuery = `
      UPDATE approvals 
      SET decision = 'Rejected',
          approver_id = ?,
          decision_date = NOW()
      WHERE entity_type = 'Resource' AND entity_id = ? AND decision = 'Pending'
    `;

    const [approvalResult] = await pool.query<ResultSetHeader>(approvalQuery, [approverId, resourceId]);
    console.log(`❌ Approvals table updated for resource ${resourceId}. Rows affected: ${approvalResult.affectedRows}`);

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
      FROM resources r
      LEFT JOIN users u ON r.uploaded_by = u.user_id
      WHERE r.approval_status = 'Pending'
      ORDER BY r.uploaded_on DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as ResourceWithDetails[];
  }
}
