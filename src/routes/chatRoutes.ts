import { Router } from 'express';
import {
  createSession,
  getUserSessions,
  getSessionById,
  updateSession,
  deleteSession,
  streamChatMessage,
  getChatTemplates
} from '../controllers/chatController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: AI Chat session management endpoints
 */

/**
 * @swagger
 * /api/chat/sessions:
 *   get:
 *     summary: Get all chat sessions for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Completed, Pending_Approval, Approved, Rejected, Archived]
 *     responses:
 *       200:
 *         description: Chat sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatSession'
 */

/**
 * @swagger
 * /api/chat/sessions:
 *   post:
 *     summary: Create a new chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_title]
 *             properties:
 *               session_title: { type: string, example: "Formula Discussion" }
 *               linked_formula_id: { type: integer, nullable: true }
 *               metadata: { type: object, nullable: true }
 *     responses:
 *       201:
 *         description: Chat session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChatSession'
 */

/**
 * @swagger
 * /api/chat/sessions/{id}/interactions:
 *   post:
 *     summary: Add interaction to chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prompt, response, model_name, tokens_used, response_time_ms]
 *             properties:
 *               prompt: { type: string, example: "What is the density of water?" }
 *               response: { type: string, example: "The density of water is 1.0 g/cm³" }
 *               model_name: { type: string, example: "gpt-4" }
 *               tokens_used: { type: integer, example: 25 }
 *               response_time_ms: { type: integer, example: 1500 }
 *     responses:
 *       201:
 *         description: Interaction added successfully
 */

/**
 * @swagger
 * /api/chat/sessions/{id}/interactions:
 *   get:
 *     summary: Get all interactions for a chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat session ID
 *     responses:
 *       200:
 *         description: Interactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       interaction_id: { type: integer }
 *                       chat_session_id: { type: integer }
 *                       prompt: { type: string }
 *                       response: { type: string }
 *                       model_name: { type: string }
 *                       tokens_used: { type: integer }
 *                       response_time_ms: { type: integer }
 *                       created_on: { type: string, format: date-time }
 */

// Route handlers
router.get('/sessions', getUserSessions);
router.post('/sessions', createSession);
router.get('/sessions/:id', getSessionById);
router.put('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);
router.post('/stream', streamChatMessage);
router.get('/templates', getChatTemplates);

export default router;
