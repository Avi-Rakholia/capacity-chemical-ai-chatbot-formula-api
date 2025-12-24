import { Request, Response } from 'express';
import { ChatService } from '../services/chatService';

const chatService = new ChatService();

/**
 * Create a new chat session
 */
export const createSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const session = await chatService.createSession({
      user_id: userId,
      session_title: req.body.session_title || 'New Chat',
      status: req.body.status || 'Active',
      linked_formula_id: req.body.linked_formula_id,
      summary: req.body.summary,
      metadata: req.body.metadata
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
      error: error.message
    });
  }
};

/**
 * Get all sessions for current user
 */
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.query.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const status = req.query.status as string | undefined;
    const sessions = await chatService.getUserSessions(Number(userId), status);

    res.json({
      success: true,
      data: sessions
    });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
};

/**
 * Get session by ID with interactions
 */
export const getSessionById = async (req: Request, res: Response) => {
  try {
    const sessionId = Number(req.params.id);
    const session = await chatService.getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const interactions = await chatService.getSessionInteractions(sessionId);

    res.json({
      success: true,
      data: {
        ...session,
        interactions
      }
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session',
      error: error.message
    });
  }
};

/**
 * Update session
 */
export const updateSession = async (req: Request, res: Response) => {
  try {
    const sessionId = Number(req.params.id);
    const session = await chatService.updateSession(sessionId, req.body);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message
    });
  }
};

/**
 * Delete session
 */
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const sessionId = Number(req.params.id);
    const deleted = await chatService.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: error.message
    });
  }
};

/**
 * Stream chat response with SSE
 */
export const streamChatMessage = async (req: Request, res: Response) => {
  try {
    const { session_id, message, attachments } = req.body;
    const userId = (req as any).user?.id || req.body.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!session_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'session_id and message are required'
      });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Create interaction record
    const startTime = Date.now();
    const interaction = await chatService.createInteraction({
      chat_session_id: session_id,
      prompt: message,
      model_name: 'gpt-4',
      attachments: attachments || []
    });

    let fullResponse = '';
    let conversationId: string | undefined;

    try {
      // Stream from AI service
      const stream = chatService.streamAIResponse(message, attachments, session_id);

      for await (const chunk of stream) {
        fullResponse += chunk;
        
        // Send SSE event
        res.write(`data: ${JSON.stringify({ 
          chunk, 
          interaction_id: interaction.interaction_id 
        })}\n\n`);
      }

      // Get the conversation_id from the session after AI response
      const session = await chatService.getSessionById(session_id);
      conversationId = session?.conversation_id;

      // Send completion event with conversation_id
      res.write(`data: ${JSON.stringify({ 
        done: true, 
        interaction_id: interaction.interaction_id,
        full_response: fullResponse,
        conversation_id: conversationId
      })}\n\n`);

      // Update interaction with full response
      const responseTime = Date.now() - startTime;
      await chatService.updateInteractionResponse(
        interaction.interaction_id,
        fullResponse,
        undefined, // tokens - would come from AI service
        responseTime
      );

      res.end();
    } catch (streamError: any) {
      // Send error event
      res.write(`data: ${JSON.stringify({ 
        error: true, 
        message: streamError.message 
      })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('Error streaming chat:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to stream chat message',
        error: error.message
      });
    } else {
      res.write(`data: ${JSON.stringify({ 
        error: true, 
        message: error.message 
      })}\n\n`);
      res.end();
    }
  }
};

/**
 * Get chat templates
 */
export const getChatTemplates = async (req: Request, res: Response) => {
  try {
    const templates = chatService.getChatTemplates();
    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
};
