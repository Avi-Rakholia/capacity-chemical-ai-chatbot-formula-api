import { Request, Response } from 'express';
import { ApprovalService } from '../services';
import { CreateApprovalRequest, UpdateApprovalRequest } from '../models';

const approvalService = new ApprovalService();

/**
 * @swagger
 * tags:
 *   name: Approvals
 *   description: Approval management endpoints
 */

/**
 * @swagger
 * /api/approvals:
 *   get:
 *     summary: Get all approvals
 *     tags: [Approvals]
 *     parameters:
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *           enum: [Formula, Quote]
 *         description: Filter by entity type
 *       - in: query
 *         name: decision
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Rejected, Returned]
 *         description: Filter by decision status
 *       - in: query
 *         name: approver_id
 *         schema:
 *           type: integer
 *         description: Filter by approver ID
 *     responses:
 *       200:
 *         description: List of approvals
 *       500:
 *         description: Server error
 */
export const getAllApprovals = async (req: Request, res: Response) => {
  try {
    const { entity_type, decision, approver_id } = req.query;

    const filters: any = {};
    if (entity_type) filters.entity_type = entity_type as 'Formula' | 'Quote';
    if (decision) filters.decision = decision as any;
    if (approver_id) filters.approver_id = parseInt(approver_id as string);

    const approvals = await approvalService.getAllApprovals(filters);

    res.json({
      success: true,
      data: approvals,
      count: approvals.length
    });
  } catch (error: any) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approvals',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/approvals/{id}:
 *   get:
 *     summary: Get approval by ID
 *     tags: [Approvals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Approval ID
 *     responses:
 *       200:
 *         description: Approval details
 *       404:
 *         description: Approval not found
 *       500:
 *         description: Server error
 */
export const getApprovalById = async (req: Request, res: Response) => {
  try {
    const approvalId = parseInt(req.params.id);
    const approval = await approvalService.getApprovalById(approvalId);

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: 'Approval not found'
      });
    }

    res.json({
      success: true,
      data: approval
    });
  } catch (error: any) {
    console.error('Error fetching approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approval',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/approvals:
 *   post:
 *     summary: Create a new approval request
 *     tags: [Approvals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entity_type
 *               - entity_id
 *               - approver_id
 *             properties:
 *               entity_type:
 *                 type: string
 *                 enum: [Formula, Quote]
 *               entity_id:
 *                 type: integer
 *               approver_id:
 *                 type: integer
 *               decision:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected, Returned]
 *               comments:
 *                 type: string
 *     responses:
 *       201:
 *         description: Approval created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const createApproval = async (req: Request, res: Response) => {
  try {
    const data: CreateApprovalRequest = req.body;

    // Validation
    if (!data.entity_type || !data.entity_id || !data.approver_id) {
      return res.status(400).json({
        success: false,
        error: 'entity_type, entity_id, and approver_id are required'
      });
    }

    const approval = await approvalService.createApproval(data);

    res.status(201).json({
      success: true,
      data: approval,
      message: 'Approval created successfully'
    });
  } catch (error: any) {
    console.error('Error creating approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create approval',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/approvals/{id}:
 *   put:
 *     summary: Update approval decision
 *     tags: [Approvals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Approval ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decision
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected, Returned]
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval updated successfully
 *       404:
 *         description: Approval not found
 *       500:
 *         description: Server error
 */
export const updateApproval = async (req: Request, res: Response) => {
  try {
    const approvalId = parseInt(req.params.id);
    const data: UpdateApprovalRequest = req.body;

    if (!data.decision) {
      return res.status(400).json({
        success: false,
        error: 'decision is required'
      });
    }

    const approval = await approvalService.updateApproval(approvalId, data);

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: 'Approval not found'
      });
    }

    res.json({
      success: true,
      data: approval,
      message: 'Approval updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update approval',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/approvals/{id}:
 *   delete:
 *     summary: Delete an approval
 *     tags: [Approvals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Approval ID
 *     responses:
 *       200:
 *         description: Approval deleted successfully
 *       404:
 *         description: Approval not found
 *       500:
 *         description: Server error
 */
export const deleteApproval = async (req: Request, res: Response) => {
  try {
    const approvalId = parseInt(req.params.id);
    const deleted = await approvalService.deleteApproval(approvalId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Approval not found'
      });
    }

    res.json({
      success: true,
      message: 'Approval deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete approval',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/approvals/stats/pending:
 *   get:
 *     summary: Get pending approvals count
 *     tags: [Approvals]
 *     responses:
 *       200:
 *         description: Pending count
 *       500:
 *         description: Server error
 */
export const getPendingCount = async (req: Request, res: Response) => {
  try {
    const count = await approvalService.getPendingCount();

    res.json({
      success: true,
      data: { pending_count: count }
    });
  } catch (error: any) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending count',
      message: error.message
    });
  }
};
