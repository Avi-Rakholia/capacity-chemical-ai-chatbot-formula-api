import express from 'express';
import {
  registerWithSupabase,
  loginWithSupabase,
  logout,
  getCurrentUser,
  refreshToken,
  requestPasswordReset,
  updatePassword
} from '../controllers/supabaseAuthController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Supabase Auth
 *   description: Authentication endpoints using Supabase
 */

/**
 * @swagger
 * /auth/supabase/register:
 *   post:
 *     summary: Register a new user with Supabase
 *     tags: [Supabase Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
router.post('/register', registerWithSupabase);

/**
 * @swagger
 * /auth/supabase/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Supabase Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginWithSupabase);

/**
 * @swagger
 * /auth/supabase/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Supabase Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/supabase/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Supabase Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @swagger
 * /auth/supabase/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Supabase Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /auth/supabase/reset-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Supabase Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         description: Invalid email
 */
router.post('/reset-password', requestPasswordReset);

/**
 * @swagger
 * /auth/supabase/update-password:
 *   put:
 *     summary: Update user password
 *     tags: [Supabase Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/update-password', authenticateToken, updatePassword);

export default router;
