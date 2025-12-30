import { Router } from 'express';
import {
  getUserStatistics,
  getChatSessionStatistics,
  getChatTimeline,
  getDashboardAnalytics,
  getMessageTimeline,
  getUserEngagement
} from '../controllers/analyticsController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and reporting endpoints
 */

/**
 * @swagger
 * /api/analytics/users/statistics:
 *   get:
 *     summary: Get user statistics (active/inactive count)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_users:
 *                       type: integer
 *                     active_users:
 *                       type: integer
 *                     inactive_users:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/users/statistics', getUserStatistics);

/**
 * @swagger
 * /api/analytics/chat-sessions/statistics:
 *   get:
 *     summary: Get chat session statistics including average messages per session
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat session statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: object
 *                       properties:
 *                         total_chat_sessions:
 *                           type: integer
 *                         active_sessions:
 *                           type: integer
 *                         completed_sessions:
 *                           type: integer
 *                         archived_sessions:
 *                           type: integer
 *                     messages:
 *                       type: object
 *                       properties:
 *                         total_messages:
 *                           type: integer
 *                         sessions_with_messages:
 *                           type: integer
 *                         avg_messages_per_session:
 *                           type: number
 *       500:
 *         description: Server error
 */
router.get('/chat-sessions/statistics', getChatSessionStatistics);

/**
 * @swagger
 * /api/analytics/chat-sessions/timeline:
 *   get:
 *     summary: Get chat sessions timeline data for graphs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days, 365days]
 *           default: 30days
 *         description: Time period for the timeline
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: How to group the timeline data
 *     responses:
 *       200:
 *         description: Chat timeline data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       session_count:
 *                         type: integer
 *                       unique_users:
 *                         type: integer
 *                       completed_count:
 *                         type: integer
 *                       active_count:
 *                         type: integer
 *                 meta:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                     groupBy:
 *                       type: string
 *                     daysBack:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/chat-sessions/timeline', getChatTimeline);

/**
 * @swagger
 * /api/analytics/messages/timeline:
 *   get:
 *     summary: Get message activity timeline data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days, 365days]
 *           default: 30days
 *         description: Time period for the timeline
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: How to group the timeline data
 *     responses:
 *       200:
 *         description: Message timeline data retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/messages/timeline', getMessageTimeline);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                     sessions:
 *                       type: object
 *                     messages:
 *                       type: object
 *                     formulas:
 *                       type: object
 *                     recentActivity:
 *                       type: object
 *                     topUsers:
 *                       type: array
 *       500:
 *         description: Server error
 */
router.get('/dashboard', getDashboardAnalytics);

/**
 * @swagger
 * /api/analytics/users/engagement:
 *   get:
 *     summary: Get user engagement metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User engagement data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 *                       total_sessions:
 *                         type: integer
 *                       total_messages:
 *                         type: integer
 *                       last_session_date:
 *                         type: string
 *                       days_since_last_session:
 *                         type: integer
 *       500:
 *         description: Server error
 */
router.get('/users/engagement', getUserEngagement);

export default router;
