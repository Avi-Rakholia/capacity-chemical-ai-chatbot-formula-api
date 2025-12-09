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
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
