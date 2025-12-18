import { Router } from 'express';
import {
  getAllApprovals,
  getApprovalById,
  createApproval,
  updateApproval,
  deleteApproval,
  getPendingCount
} from '../controllers/approvalController';

const router = Router();

// GET all approvals with optional filters
router.get('/', getAllApprovals);

// GET pending count
router.get('/stats/pending', getPendingCount);

// GET approval by ID
router.get('/:id', getApprovalById);

// POST create new approval
router.post('/', createApproval);

// PUT update approval decision
router.put('/:id', updateApproval);

// DELETE approval
router.delete('/:id', deleteApproval);

export default router;
