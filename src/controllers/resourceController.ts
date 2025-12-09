import { Request, Response } from 'express';
import { ResourceService } from '../services';
import { CreateResourceRequest, UpdateResourceRequest } from '../models';
import { upload, getFileUrl, formatFileSize, deleteFile } from '../config/upload';
import path from 'path';

const resourceService = new ResourceService();

/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: Resource/file management endpoints
 */

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Resources]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [formulas, quotes, knowledge, other]
 *         description: Filter by category
 *       - in: query
 *         name: uploaded_by
 *         schema:
 *           type: integer
 *         description: Filter by uploader user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in file name and description
 *     responses:
 *       200:
 *         description: List of resources
 *       500:
 *         description: Server error
 */
export const getAllResources = async (req: Request, res: Response) => {
  try {
    const { category, uploaded_by, search } = req.query;

    const filters: any = {};
    if (category) filters.category = category as any;
    if (uploaded_by) filters.uploaded_by = parseInt(uploaded_by as string);
    if (search) filters.search = search as string;

    const resources = await resourceService.getAllResources(filters);

    res.json({
      success: true,
      data: resources,
      count: resources.length
    });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resources',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources/{id}:
 *   get:
 *     summary: Get resource by ID
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource details
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 */
export const getResourceById = async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const resource = await resourceService.getResourceById(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Create a new resource
 *     tags: [Resources]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - file_name
 *               - file_type
 *               - file_size
 *               - file_url
 *               - category
 *               - uploaded_by
 *             properties:
 *               file_name:
 *                 type: string
 *               file_type:
 *                 type: string
 *               file_size:
 *                 type: string
 *               file_url:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [formulas, quotes, knowledge, other]
 *               uploaded_by:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resource created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
export const createResource = async (req: Request, res: Response) => {
  try {
    const data: CreateResourceRequest = req.body;

    // Validation
    if (!data.file_name || !data.file_type || !data.file_size || 
        !data.file_url || !data.category || !data.uploaded_by) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    const resource = await resourceService.createResource(data);

    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource created successfully'
    });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create resource',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources/{id}:
 *   put:
 *     summary: Update resource metadata
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file_name:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [formulas, quotes, knowledge, other]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 */
export const updateResource = async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const data: UpdateResourceRequest = req.body;

    const resource = await resourceService.updateResource(resourceId, data);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    res.json({
      success: true,
      data: resource,
      message: 'Resource updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resource',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources/{id}:
 *   delete:
 *     summary: Delete a resource
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 */
export const deleteResource = async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    
    // Get resource details before deleting
    const resource = await resourceService.getResourceById(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    // Delete from database
    const deleted = await resourceService.deleteResource(resourceId);

    if (deleted) {
      // Delete physical file
      const urlParts = resource.file_url.split('/uploads/');
      if (urlParts.length >= 2) {
        deleteFile(urlParts[1]);
      }

      res.json({
        success: true,
        message: 'Resource deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources/stats:
 *   get:
 *     summary: Get resource statistics
 *     tags: [Resources]
 *     responses:
 *       200:
 *         description: Resource statistics
 *       500:
 *         description: Server error
 */
export const getResourceStats = async (req: Request, res: Response) => {
  try {
    const stats = await resourceService.getResourceStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching resource stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource stats',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources/upload:
 *   post:
 *     summary: Upload a new resource file
 *     tags: [Resources]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - category
 *               - uploaded_by
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *                 enum: [formulas, quotes, knowledge, other]
 *               uploaded_by:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid input or file type
 *       500:
 *         description: Server error
 */
export const uploadResource = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { category, uploaded_by, description } = req.body;

    if (!category || !uploaded_by) {
      return res.status(400).json({
        success: false,
        error: 'category and uploaded_by are required'
      });
    }

    // Get file details
    const file = req.file;
    const fileSize = formatFileSize(file.size);
    const relativePath = path.join(category, file.filename).replace(/\\/g, '/');
    const fileUrl = getFileUrl(req, relativePath);

    // Determine file type from mimetype
    let fileType = 'Unknown';
    if (file.mimetype.includes('pdf')) fileType = 'PDF Document';
    else if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) fileType = 'Excel Spreadsheet';
    else if (file.mimetype.includes('word') || file.mimetype.includes('document')) fileType = 'Word Document';
    else if (file.mimetype.includes('text')) fileType = 'Text File';
    else if (file.mimetype.includes('image')) fileType = 'Image';

    // Create resource in database
    const resourceData: CreateResourceRequest = {
      file_name: file.originalname,
      file_type: fileType,
      file_size: fileSize,
      file_url: fileUrl,
      category: category,
      uploaded_by: parseInt(uploaded_by),
      description: description || null
    };

    const resource = await resourceService.createResource(resourceData);

    res.status(201).json({
      success: true,
      data: resource,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources/{id}/download:
 *   get:
 *     summary: Download a resource file
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: File download
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 */
export const downloadResource = async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const resource = await resourceService.getResourceById(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    // Extract file path from URL
    const urlParts = resource.file_url.split('/uploads/');
    if (urlParts.length < 2) {
      return res.status(404).json({
        success: false,
        error: 'Invalid file URL'
      });
    }

    const filePath = path.join(process.cwd(), 'uploads', urlParts[1]);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }

    // Send file
    res.download(filePath, resource.file_name);
  } catch (error: any) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources/{id}/approve:
 *   post:
 *     summary: Approve a pending resource
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approver_id
 *             properties:
 *               approver_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Resource approved successfully
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 */
export const approveResource = async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { approver_id } = req.body;

    if (!approver_id) {
      return res.status(400).json({
        success: false,
        error: 'Approver ID is required'
      });
    }

    const resource = await resourceService.approveResource(resourceId, approver_id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    res.json({
      success: true,
      data: resource,
      message: 'Resource approved successfully'
    });
  } catch (error: any) {
    console.error('Error approving resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve resource',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources/{id}/reject:
 *   post:
 *     summary: Reject a pending resource
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approver_id
 *             properties:
 *               approver_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Resource rejected successfully
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Server error
 */
export const rejectResource = async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { approver_id } = req.body;

    if (!approver_id) {
      return res.status(400).json({
        success: false,
        error: 'Approver ID is required'
      });
    }

    const resource = await resourceService.rejectResource(resourceId, approver_id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    res.json({
      success: true,
      data: resource,
      message: 'Resource rejected successfully'
    });
  } catch (error: any) {
    console.error('Error rejecting resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject resource',
      message: error.message
    });
  }
};

/**
 * @swagger
 * /api/resources/pending:
 *   get:
 *     summary: Get all pending resources (for approval)
 *     tags: [Resources]
 *     responses:
 *       200:
 *         description: List of pending resources
 *       500:
 *         description: Server error
 */
export const getPendingResources = async (req: Request, res: Response) => {
  try {
    const resources = await resourceService.getPendingResources();

    res.json({
      success: true,
      data: resources,
      count: resources.length
    });
  } catch (error: any) {
    console.error('Error fetching pending resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending resources',
      message: error.message
    });
  }
};
