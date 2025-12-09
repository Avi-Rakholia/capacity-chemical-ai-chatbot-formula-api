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

const router = Router();

// POST upload new resource file
router.post('/upload', upload.single('file'), uploadResource);

// GET download resource file
router.get('/:id/download', downloadResource);

// POST approve resource
router.post('/:id/approve', approveResource);

// POST reject resource
router.post('/:id/reject', rejectResource);

// GET all pending resources
router.get('/pending', getPendingResources);

// GET all resources with optional filters
router.get('/', getAllResources);

// GET resource statistics
router.get('/stats', getResourceStats);

// GET resource by ID
router.get('/:id', getResourceById);

// POST create new resource (metadata only)
router.post('/', createResource);

// PUT update resource metadata
router.put('/:id', updateResource);

// DELETE resource
router.delete('/:id', deleteResource);

export default router;
