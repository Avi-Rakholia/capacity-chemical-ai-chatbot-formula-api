import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import supabaseAuthRoutes from './routes/supabaseAuthRoutes';
import userRoutes from './routes/userRoutes';
import formulaRoutes from './routes/formulaRoutes';
import chatRoutes from './routes/chatRoutes';
import approvalRoutes from './routes/approvalRoutes';
import resourceRoutes from './routes/resourceRoutes';
import { testConnection } from './db/db';
import { setupSwagger } from './config/swagger';
dotenv.config();

const app = express();

// Configure CORS to allow file access
app.use(cors({
  origin: '*', // Allow all origins (adjust in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Serve static files from uploads directory with proper headers
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set proper content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.csv': 'text/csv',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }
    
    // Allow CORS for file access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Log uploads directory path for debugging
console.log('📁 Uploads directory:', uploadsPath);

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/auth', authRoutes);
app.use('/auth/supabase', supabaseAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/formulas', formulaRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/resources', resourceRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     description: Check if the API is running and healthy
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Capacity Chemical API is running!"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T10:00:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Capacity Chemical API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Debug endpoint to check uploads directory
app.get('/api/uploads/check', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(process.cwd(), 'uploads');
  
  try {
    const exists = fs.existsSync(uploadsPath);
    const categories = exists ? fs.readdirSync(uploadsPath) : [];
    
    const files: any = {};
    if (exists) {
      categories.forEach((cat: string) => {
        const catPath = path.join(uploadsPath, cat);
        if (fs.statSync(catPath).isDirectory()) {
          files[cat] = fs.readdirSync(catPath);
        }
      });
    }
    
    res.json({
      success: true,
      uploadsPath,
      exists,
      categories,
      files
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fallback endpoint to find and serve files from any category
app.get('/uploads/:category/:filename', (req, res) => {
  const fs = require('fs');
  const { category, filename } = req.params;
  
  // First try the requested category
  let filePath = path.join(uploadsPath, category, filename);
  
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  
  // If not found, search all categories
  const categories = ['formulas', 'quotes', 'knowledge', 'other'];
  for (const cat of categories) {
    filePath = path.join(uploadsPath, cat, filename);
    if (fs.existsSync(filePath)) {
      console.log(`📁 File found in '${cat}' folder, redirecting...`);
      return res.redirect(`/uploads/${cat}/${filename}`);
    }
  }
  
  // File not found in any category
  return res.status(404).json({
    success: false,
    error: 'File not found',
    searchedIn: categories,
    filename
  });
});

// Utility endpoint to fix resource file URLs in database
app.post('/api/uploads/fix-urls', async (req, res) => {
  const fs = require('fs');
  try {
    const { pool } = require('./db/db');
    
    // Get all resources
    const [resources]: any = await pool.query('SELECT resource_id, file_name, file_url, category FROM resources');
    
    const fixed: any[] = [];
    const errors: any[] = [];
    
    for (const resource of resources) {
      try {
        // Extract filename from URL
        const urlParts = resource.file_url.split('/uploads/');
        if (urlParts.length < 2) continue;
        
        const [category, filename] = urlParts[1].split('/');
        if (!filename) continue;
        
        // Check if file exists in stated category
        let filePath = path.join(uploadsPath, category, filename);
        let actualCategory = category;
        
        if (!fs.existsSync(filePath)) {
          // Search for file in other categories
          const categories = ['formulas', 'quotes', 'knowledge', 'other'];
          let found = false;
          
          for (const cat of categories) {
            filePath = path.join(uploadsPath, cat, filename);
            if (fs.existsSync(filePath)) {
              actualCategory = cat;
              found = true;
              break;
            }
          }
          
          if (found && actualCategory !== category) {
            // Update database with correct URL
            const correctUrl = `http://localhost:${PORT}/uploads/${actualCategory}/${filename}`;
            await pool.query(
              'UPDATE resources SET file_url = ?, category = ? WHERE resource_id = ?',
              [correctUrl, actualCategory, resource.resource_id]
            );
            
            fixed.push({
              resource_id: resource.resource_id,
              file_name: resource.file_name,
              old_url: resource.file_url,
              new_url: correctUrl,
              old_category: category,
              new_category: actualCategory
            });
          } else if (!found) {
            errors.push({
              resource_id: resource.resource_id,
              file_name: resource.file_name,
              file_url: resource.file_url,
              error: 'File not found in any category'
            });
          }
        }
      } catch (err: any) {
        errors.push({
          resource_id: resource.resource_id,
          error: err.message
        });
      }
    }
    
    res.json({
      success: true,
      fixed: fixed.length,
      errors: errors.length,
      details: { fixed, errors }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;

// Start server and test database connection
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
