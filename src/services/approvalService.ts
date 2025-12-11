import { pool } from '../db/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { 
  Approval, 
  CreateApprovalRequest, 
  UpdateApprovalRequest,
  ApprovalWithDetails 
} from '../models';

export class ApprovalService {
  /**
   * Get all approvals with optional filtering
   */
  async getAllApprovals(filters?: {
    entity_type?: 'Formula' | 'Quote';
    decision?: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
    approver_id?: number;
  }): Promise<ApprovalWithDetails[]> {
    let query = `
      SELECT 
        a.*,
        u.username as approver_name,
        CASE 
          WHEN a.entity_type = 'Formula' THEN f.formula_name
          WHEN a.entity_type = 'Quote' THEN CONCAT('Quote for ', q.customer_name)
          ELSE NULL
        END as entity_name,
        CASE 
          WHEN a.entity_type = 'Formula' THEN f.created_on
          WHEN a.entity_type = 'Quote' THEN q.created_on
          ELSE NULL
        END as request_date
      FROM approvals a
      LEFT JOIN users u ON a.approver_id = u.user_id
      LEFT JOIN formulas f ON a.entity_type = 'Formula' AND a.entity_id = f.formula_id
      LEFT JOIN quotes q ON a.entity_type = 'Quote' AND a.entity_id = q.quote_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.entity_type) {
      query += ' AND a.entity_type = ?';
      params.push(filters.entity_type);
    }

    if (filters?.decision) {
      query += ' AND a.decision = ?';
      params.push(filters.decision);
    }

    if (filters?.approver_id) {
      query += ' AND a.approver_id = ?';
      params.push(filters.approver_id);
    }

    query += ' ORDER BY a.decision_date DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as ApprovalWithDetails[];
  }

  /**
   * Get approval by ID
   */
  async getApprovalById(approvalId: number): Promise<ApprovalWithDetails | null> {
    const query = `
      SELECT 
        a.*,
        u.username as approver_name,
        CASE 
          WHEN a.entity_type = 'Formula' THEN f.formula_name
          WHEN a.entity_type = 'Quote' THEN CONCAT('Quote for ', q.customer_name)
          ELSE NULL
        END as entity_name
      FROM approvals a
      LEFT JOIN users u ON a.approver_id = u.user_id
      LEFT JOIN formulas f ON a.entity_type = 'Formula' AND a.entity_id = f.formula_id
      LEFT JOIN quotes q ON a.entity_type = 'Quote' AND a.entity_id = q.quote_id
      WHERE a.approval_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [approvalId]);
    return rows.length > 0 ? (rows[0] as ApprovalWithDetails) : null;
  }

  /**
   * Create a new approval request
   */
  async createApproval(data: CreateApprovalRequest): Promise<Approval> {
    const query = `
      INSERT INTO approvals (entity_type, entity_id, approver_id, decision, comments)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [
      data.entity_type,
      data.entity_id,
      data.approver_id,
      data.decision || 'Pending',
      data.comments || null
    ]);

    const approval = await this.getApprovalById(result.insertId);
    return approval as Approval;
  }

  /**
   * Update approval decision
   */
  async updateApproval(
    approvalId: number, 
    data: UpdateApprovalRequest
  ): Promise<Approval | null> {
    const query = `
      UPDATE approvals 
      SET decision = ?, comments = ?, decision_date = NOW()
      WHERE approval_id = ?
    `;

    await pool.query(query, [
      data.decision,
      data.comments || null,
      approvalId
    ]);

    return this.getApprovalById(approvalId);
  }

  /**
   * Delete an approval
   */
  async deleteApproval(approvalId: number): Promise<boolean> {
    const query = 'DELETE FROM approvals WHERE approval_id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [approvalId]);
    return result.affectedRows > 0;
  }

  /**
   * Get pending approvals count
   */
  async getPendingCount(): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM approvals 
      WHERE decision = 'Pending'
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows[0].count;
  }
}
