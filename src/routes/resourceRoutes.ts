import { Router } from 'express';
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getResourceStats,
  uploadResource,
  downloadResource,
  approveResource,
  rejectResource,
  getPendingResources
} from '../controllers/resourceController';
import { upload } from '../config/upload';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// POST upload new resource file (requires authentication)
router.post('/upload', authenticateToken, upload.single('file'), uploadResource);

// GET download resource file (requires authentication)
router.get('/:id/download', authenticateToken, downloadResource);

// POST approve resource (requires admin)
router.post('/:id/approve', authenticateToken, requireAdmin, approveResource);

// POST reject resource (requires admin)
router.post('/:id/reject', authenticateToken, requireAdmin, rejectResource);

// GET all pending resources (requires admin)
router.get('/pending', authenticateToken, requireAdmin, getPendingResources);

// GET all resources with optional filters (requires authentication)
router.get('/', authenticateToken, getAllResources);

// GET resource statistics (requires authentication)
router.get('/stats', authenticateToken, getResourceStats);

// GET resource by ID (requires authentication)
router.get('/:id', authenticateToken, getResourceById);

// POST create new resource - metadata only (requires authentication)
router.post('/', authenticateToken, createResource);

// PUT update resource metadata (requires authentication)
router.put('/:id', authenticateToken, updateResource);

// DELETE resource (requires authentication)
router.delete('/:id', authenticateToken, deleteResource);

export default router;
