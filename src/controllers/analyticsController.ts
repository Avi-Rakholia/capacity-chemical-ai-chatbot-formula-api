import { Request, Response } from 'express';
import { pool } from '../db/db';
import { RowDataPacket } from 'mysql2';

/**
 * Get user statistics (active and inactive users)
 */
export const getUserStatistics = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_users
      FROM users
    `);

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

/**
 * Get chat session statistics
 */
export const getChatSessionStatistics = async (req: Request, res: Response) => {
  try {
    const [sessionStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_chat_sessions,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_sessions,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_sessions,
        SUM(CASE WHEN status = 'Archived' THEN 1 ELSE 0 END) as archived_sessions
      FROM chat_sessions
    `);

    const [messageStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT chat_session_id) as sessions_with_messages,
        ROUND(COUNT(*) / NULLIF(COUNT(DISTINCT chat_session_id), 0), 2) as avg_messages_per_session
      FROM chat_interactions
    `);

    res.status(200).json({
      success: true,
      data: {
        sessions: sessionStats[0],
        messages: messageStats[0]
      }
    });
  } catch (error: any) {
    console.error('Error fetching chat session statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat session statistics',
      error: error.message
    });
  }
};

/**
 * Get chat timeline data (chats across timeline)
 */
export const getChatTimeline = async (req: Request, res: Response) => {
  try {
    const { period = '30days', groupBy = 'day' } = req.query;

    let dateFormat: string;
    let dateInterval: string;

    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        dateInterval = '1 HOUR';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        dateInterval = '1 DAY';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        dateInterval = '1 WEEK';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        dateInterval = '1 MONTH';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        dateInterval = '1 DAY';
    }

    let daysBack = 30;
    if (period === '7days') daysBack = 7;
    else if (period === '30days') daysBack = 30;
    else if (period === '90days') daysBack = 90;
    else if (period === '365days') daysBack = 365;

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        DATE_FORMAT(start_time, ?) as period,
        COUNT(*) as session_count,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count
      FROM chat_sessions
      WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY period
      ORDER BY period ASC
    `, [dateFormat, daysBack]);

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        period,
        groupBy,
        daysBack
      }
    });
  } catch (error: any) {
    console.error('Error fetching chat timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat timeline',
      error: error.message
    });
  }
};

/**
 * Get comprehensive analytics dashboard data
 */
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    // User statistics
    const [userStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_users
      FROM users
    `);

    // Chat session statistics
    const [sessionStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_chat_sessions,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_sessions,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_sessions
      FROM chat_sessions
    `);

    // Message statistics
    const [messageStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT chat_session_id) as sessions_with_messages,
        ROUND(COUNT(*) / NULLIF(COUNT(DISTINCT chat_session_id), 0), 2) as avg_messages_per_session
      FROM chat_interactions
    `);

    // Formula statistics
    const [formulaStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_formulas,
        SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft_formulas,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_formulas,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_formulas,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_formulas
      FROM formulas
    `);

    // Recent activity (last 30 days)
    const [recentActivity] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users_30d,
        COUNT(*) as new_sessions_30d
      FROM chat_sessions
      WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    // Top users by chat sessions
    const [topUsers] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        COUNT(cs.chat_session_id) as session_count
      FROM users u
      LEFT JOIN chat_sessions cs ON u.user_id = cs.user_id
      GROUP BY u.user_id, u.username, u.email
      ORDER BY session_count DESC
      LIMIT 10
    `);

    res.status(200).json({
      success: true,
      data: {
        users: userStats[0],
        sessions: sessionStats[0],
        messages: messageStats[0],
        formulas: formulaStats[0],
        recentActivity: recentActivity[0],
        topUsers: topUsers
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
};

/**
 * Get message activity timeline
 */
export const getMessageTimeline = async (req: Request, res: Response) => {
  try {
    const { period = '30days', groupBy = 'day' } = req.query;

    let dateFormat: string;
    let daysBack = 30;

    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    if (period === '7days') daysBack = 7;
    else if (period === '30days') daysBack = 30;
    else if (period === '90days') daysBack = 90;
    else if (period === '365days') daysBack = 365;

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        DATE_FORMAT(ci.timestamp, ?) as period,
        COUNT(*) as message_count,
        COUNT(DISTINCT ci.chat_session_id) as active_sessions,
        COUNT(DISTINCT cs.user_id) as active_users
      FROM chat_interactions ci
      LEFT JOIN chat_sessions cs ON ci.chat_session_id = cs.chat_session_id
      WHERE ci.timestamp >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY period
      ORDER BY period ASC
    `, [dateFormat, daysBack]);

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        period,
        groupBy,
        daysBack
      }
    });
  } catch (error: any) {
    console.error('Error fetching message timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message timeline',
      error: error.message
    });
  }
};

/**
 * Get user engagement metrics
 */
export const getUserEngagement = async (req: Request, res: Response) => {
  try {
    const [engagement] = await pool.query<RowDataPacket[]>(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.status,
        u.last_login,
        COUNT(DISTINCT cs.chat_session_id) as total_sessions,
        COUNT(DISTINCT ci.interaction_id) as total_messages,
        DATE(MAX(cs.start_time)) as last_session_date,
        DATEDIFF(CURDATE(), DATE(MAX(cs.start_time))) as days_since_last_session
      FROM users u
      LEFT JOIN chat_sessions cs ON u.user_id = cs.user_id
      LEFT JOIN chat_interactions ci ON cs.chat_session_id = ci.chat_session_id
      GROUP BY u.user_id, u.username, u.email, u.status, u.last_login
      ORDER BY total_sessions DESC
    `);

    res.status(200).json({
      success: true,
      data: engagement
    });
  } catch (error: any) {
    console.error('Error fetching user engagement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user engagement',
      error: error.message
    });
  }
};
