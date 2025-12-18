import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../db/db';
import { 
  Formula, 
  FormulaComponent, 
  FormulaWithComponents, 
  CreateFormulaRequest, 
  UpdateFormulaRequest,
  CreateFormulaComponentRequest,
  PaginationParams,
  PaginatedResponse
} from '../models';

export class FormulaService {
  
  async getAllFormulas(params: PaginationParams & { status?: string; created_by?: number }): Promise<PaginatedResponse<Formula>> {
    const { page = 1, limit = 10, sortBy = 'created_on', sortOrder = 'DESC', status, created_by } = params;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams: any[] = [];

    if (status) {
      whereClause += ' WHERE f.status = ?';
      queryParams.push(status);
    }

    if (created_by) {
      whereClause += whereClause ? ' AND f.created_by = ?' : ' WHERE f.created_by = ?';
      queryParams.push(created_by);
    }

    // Count total records
    const [countResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM formulas f ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    // Get paginated data
    const query = `
      SELECT f.*, u.name as creator_name 
      FROM formulas f 
      LEFT JOIN users u ON f.created_by = u.user_id 
      ${whereClause}
      ORDER BY f.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      query,
      [...queryParams, limit, offset]
    );

    return {
      data: rows as Formula[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getFormulaById(id: number): Promise<FormulaWithComponents | null> {
    const [formulaRows] = await pool.execute<RowDataPacket[]>(
      `SELECT f.*, u.name as creator_name 
       FROM formulas f 
       LEFT JOIN users u ON f.created_by = u.user_id 
       WHERE f.formula_id = ?`,
      [id]
    );

    if (formulaRows.length === 0) {
      return null;
    }

    const formula = formulaRows[0] as Formula & { creator_name: string };

    // Get components
    const [componentRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM formula_components WHERE formula_id = ?',
      [id]
    );

    const components = componentRows as FormulaComponent[];

    return {
      ...formula,
      components
    };
  }

  async createFormula(formulaData: CreateFormulaRequest & { components?: CreateFormulaComponentRequest[] }): Promise<Formula> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO formulas (formula_name, created_by, density, total_cost, margin, container_cost, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          formulaData.formula_name,
          formulaData.created_by,
          formulaData.density,
          formulaData.total_cost,
          formulaData.margin,
          formulaData.container_cost,
          formulaData.status || 'Draft'
        ]
      );

      const formulaId = result.insertId;

      // Add components if provided
      if (formulaData.components && formulaData.components.length > 0) {
        for (const component of formulaData.components) {
          await connection.execute(
            `INSERT INTO formula_components (formula_id, chemical_name, percentage, cost_per_lb, hazard_class) 
             VALUES (?, ?, ?, ?, ?)`,
            [formulaId, component.chemical_name, component.percentage, component.cost_per_lb, component.hazard_class]
          );
        }
      }

      await connection.commit();

      // Return the created formula
      const createdFormula = await this.getFormulaById(formulaId);
      return createdFormula as Formula;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateFormula(id: number, updateData: UpdateFormulaRequest): Promise<Formula | null> {
    const existingFormula = await this.getFormulaById(id);
    if (!existingFormula) {
      return null;
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
      return existingFormula;
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE formulas SET ${updateFields.join(', ')} WHERE formula_id = ?`,
      updateValues
    );

    return await this.getFormulaById(id) as Formula;
  }

  async deleteFormula(id: number): Promise<boolean> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Delete components first (foreign key constraint)
      await connection.execute('DELETE FROM formula_components WHERE formula_id = ?', [id]);
      
      // Delete formula
      const [result] = await connection.execute<ResultSetHeader>(
        'DELETE FROM formulas WHERE formula_id = ?',
        [id]
      );

      await connection.commit();
      return result.affectedRows > 0;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async addFormulaComponent(formulaId: number, componentData: CreateFormulaComponentRequest): Promise<FormulaComponent> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO formula_components (formula_id, chemical_name, percentage, cost_per_lb, hazard_class) 
       VALUES (?, ?, ?, ?, ?)`,
      [formulaId, componentData.chemical_name, componentData.percentage, componentData.cost_per_lb, componentData.hazard_class]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM formula_components WHERE id = ?',
      [result.insertId]
    );

    return rows[0] as FormulaComponent;
  }

  async updateFormulaComponent(id: number, updateData: Partial<CreateFormulaComponentRequest>): Promise<FormulaComponent | null> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM formula_components WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] as FormulaComponent : null;
    }

    updateValues.push(id);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE formula_components SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return null;
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM formula_components WHERE id = ?',
      [id]
    );

    return rows[0] as FormulaComponent;
  }

  async deleteFormulaComponent(id: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM formula_components WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }
}
