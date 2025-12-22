import { pool } from '../db/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  ChatSession,
  ChatInteraction,
  CreateChatSessionRequest,
  CreateChatInteractionRequest,
  UpdateChatSessionRequest,
  ChatSessionWithInteractions,
  ChatAttachment,
  SendMessageRequest
} from '../models/Chat';
import axios from 'axios';
import { EventEmitter } from 'events';

export class ChatService extends EventEmitter {
  private pythonServiceUrl: string;

  constructor() {
    super();
    // Python AI service URL from environment or default
    this.pythonServiceUrl = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Create a new chat session
   */
  async createSession(data: CreateChatSessionRequest): Promise<ChatSession> {
    const query = `
      INSERT INTO chat_sessions 
      (user_id, session_title, status, linked_formula_id, summary, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [
      data.user_id,
      data.session_title || 'New Chat',
      data.status || 'Active',
      data.linked_formula_id || null,
      data.summary || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ]);

    const session = await this.getSessionById(result.insertId);
    return session as ChatSession;
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: number): Promise<ChatSession | null> {
    const query = `
      SELECT * FROM chat_sessions
      WHERE chat_session_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [sessionId]);
    if (rows.length === 0) return null;

    const session = rows[0] as ChatSession;
    if (session.metadata && typeof session.metadata === 'string') {
      session.metadata = JSON.parse(session.metadata);
    }
    return session;
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: number, status?: string): Promise<ChatSession[]> {
    let query = `
      SELECT * FROM chat_sessions
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY start_time DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.map(row => {
      const session = row as ChatSession;
      if (session.metadata && typeof session.metadata === 'string') {
        session.metadata = JSON.parse(session.metadata);
      }
      return session;
    });
  }

  /**
   * Update session
   */
  async updateSession(sessionId: number, data: UpdateChatSessionRequest): Promise<ChatSession | null> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.session_title) {
      updates.push('session_title = ?');
      params.push(data.session_title);
    }
    if (data.status) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.end_time) {
      updates.push('end_time = ?');
      params.push(data.end_time);
    }
    if (data.linked_formula_id !== undefined) {
      updates.push('linked_formula_id = ?');
      params.push(data.linked_formula_id);
    }
    if (data.summary !== undefined) {
      updates.push('summary = ?');
      params.push(data.summary);
    }
    if (data.metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(JSON.stringify(data.metadata));
    }

    if (updates.length === 0) {
      return this.getSessionById(sessionId);
    }

    params.push(sessionId);
    const query = `UPDATE chat_sessions SET ${updates.join(', ')} WHERE chat_session_id = ?`;

    await pool.query(query, params);
    return this.getSessionById(sessionId);
  }

  /**
   * Create interaction (message) in a session
   */
  async createInteraction(data: CreateChatInteractionRequest): Promise<ChatInteraction> {
    const query = `
      INSERT INTO chat_interactions 
      (chat_session_id, prompt, response, model_name, tokens_used, response_time_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [
      data.chat_session_id,
      data.prompt,
      data.response || null,
      data.model_name,
      data.tokens_used || null,
      data.response_time_ms || null
    ]);

    // Save attachments if any
    if (data.attachments && data.attachments.length > 0) {
      await this.saveAttachments(result.insertId, data.attachments);
    }

    const interaction = await this.getInteractionById(result.insertId);
    return interaction as ChatInteraction;
  }

  /**
   * Save attachments for an interaction
   */
  async saveAttachments(interactionId: number, attachments: any[]): Promise<void> {
    const query = `
      INSERT INTO chat_attachments 
      (interaction_id, attachment_type, file_name, file_url, resource_id, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const att of attachments) {
      await pool.query(query, [
        interactionId,
        att.type,
        att.file_name || null,
        att.file_url || null,
        att.resource_id || null,
        att.file_size || null,
        att.mime_type || null
      ]);
    }
  }

  /**
   * Get interaction by ID with attachments
   */
  async getInteractionById(interactionId: number): Promise<ChatInteraction | null> {
    const query = `
      SELECT * FROM chat_interactions
      WHERE interaction_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [interactionId]);
    if (rows.length === 0) return null;

    const interaction = rows[0] as ChatInteraction;

    // Get attachments
    const attachments = await this.getInteractionAttachments(interactionId);
    if (attachments.length > 0) {
      interaction.attachments = attachments;
    }

    return interaction;
  }

  /**
   * Get attachments for an interaction
   */
  async getInteractionAttachments(interactionId: number): Promise<ChatAttachment[]> {
    const query = `
      SELECT a.*, r.file_name as resource_file_name
      FROM chat_attachments a
      LEFT JOIN resources r ON a.resource_id = r.resource_id
      WHERE a.interaction_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [interactionId]);
    return rows as ChatAttachment[];
  }

  /**
   * Get all interactions for a session with attachments
   */
  async getSessionInteractions(sessionId: number): Promise<ChatInteraction[]> {
    const query = `
      SELECT * FROM chat_interactions
      WHERE chat_session_id = ?
      ORDER BY created_on ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [sessionId]);
    const interactions: ChatInteraction[] = [];

    for (const row of rows) {
      const interaction = row as ChatInteraction;
      const attachments = await this.getInteractionAttachments(interaction.interaction_id);
      if (attachments.length > 0) {
        interaction.attachments = attachments;
      }
      interactions.push(interaction);
    }

    return interactions;
  }

  /**
   * Stream AI response from Python service
   * Returns an async generator that yields chunks
   */
  async *streamAIResponse(
    prompt: string,
    attachments?: any[],
    sessionId?: number
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Determine which endpoint to use based on the query content
      const isGenerationQuery = this.isGenerationQuery(prompt);
      const endpoint = isGenerationQuery 
        ? '/generateformula/generateformula'
        : '/fetchformula/fetchformula';

      // Prepare request payload based on endpoint
      let payload: any;
      
      if (isGenerationQuery) {
        // For generation endpoint
        payload = {
          message: prompt,
          conversation_id: sessionId ? sessionId.toString() : undefined
        };
      } else {
        // For fetch endpoint  
        payload = {
          message: prompt,
          conversation_id: sessionId ? sessionId.toString() : 'default'
        };
      }

      console.log(`Using endpoint: ${endpoint}`);
      console.log('Sending payload to Python service:', JSON.stringify(payload, null, 2));

      // Call Python AI service - since main.py doesn't have streaming, we'll simulate it
      const response = await axios.post(
        `${this.pythonServiceUrl}${endpoint}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Simulate streaming by chunking the response
      const responseText = isGenerationQuery 
        ? response.data.message || response.data.response || 'No response'
        : response.data.response || response.data.message || 'No response';

      // Split response into words and yield each word as a chunk
      const words = responseText.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        yield chunk;
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error: any) {
      console.error('Error calling Python service:', error.response?.data || error.message);
      throw new Error('Failed to get AI response: ' + (error.response?.data?.detail || error.message));
    }
  }

  /**
   * Determine if the query is asking for formula generation vs fetching existing formulas
   */
  private isGenerationQuery(prompt: string): boolean {
    const generationKeywords = [
      'generate', 'create', 'make', 'develop', 'design', 'formulate',
      'new formula', 'custom formula', 'build', 'construct'
    ];
    
    const fetchKeywords = [
      'find', 'search', 'get', 'fetch', 'lookup', 'show me', 'what is',
      'details', 'information', 'components', 'ingredients'
    ];
    
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for generation keywords
    const hasGenerationKeywords = generationKeywords.some(keyword => 
      lowerPrompt.includes(keyword)
    );
    
    // Check for fetch keywords
    const hasFetchKeywords = fetchKeywords.some(keyword => 
      lowerPrompt.includes(keyword)
    );
    
    // If both or neither, default to fetch (safer for existing data)
    if (hasGenerationKeywords && !hasFetchKeywords) {
      return true;
    }
    
    return false;
  }

  /**
   * Update interaction with complete response
   */
  async updateInteractionResponse(
    interactionId: number,
    response: string,
    tokensUsed?: number,
    responseTimeMs?: number
  ): Promise<void> {
    const query = `
      UPDATE chat_interactions
      SET response = ?, tokens_used = ?, response_time_ms = ?
      WHERE interaction_id = ?
    `;

    await pool.query(query, [
      response,
      tokensUsed || null,
      responseTimeMs || null,
      interactionId
    ]);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: number): Promise<boolean> {
    const query = 'DELETE FROM chat_sessions WHERE chat_session_id = ?';
    const [result] = await pool.query<ResultSetHeader>(query, [sessionId]);
    return result.affectedRows > 0;
  }

  /**
   * Get chat templates
   */
  getChatTemplates() {
    return [
      {
        template_id: 'search-formula',
        title: 'Search Formula',
        description: 'Find existing chemical formulas',
        icon: 'search',
        prompt_template: 'Help me find formulas for {query}',
        category: 'formula'
      },
      {
        template_id: 'create-formula',
        title: 'Create Formula',
        description: 'Generate a new chemical formula',
        icon: 'plus',
        prompt_template: 'Create a new formula for {product_type} with these requirements: {requirements}',
        category: 'formula'
      },
      {
        template_id: 'generate-quote',
        title: 'Generate Quote',
        description: 'Create a customer quote',
        icon: 'document',
        prompt_template: 'Generate a quote for {product_name} with quantity {quantity} and specifications: {specs}',
        category: 'quote'
      },
      {
        template_id: 'general-chat',
        title: 'General Chat',
        description: 'Ask anything about chemicals',
        icon: 'chat',
        prompt_template: '{query}',
        category: 'general'
      }
    ];
  }
}
