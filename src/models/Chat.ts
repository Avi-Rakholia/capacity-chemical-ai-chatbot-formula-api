export interface ChatSession {
  chat_session_id: number;
  user_id: number;
  session_title: string;
  start_time: Date;
  end_time?: Date;
  status: 'Active' | 'Completed' | 'Pending_Approval' | 'Approved' | 'Rejected' | 'Archived';
  linked_formula_id?: number;
  summary?: string;
  metadata?: any; // JSON field
}

export interface CreateChatSessionRequest {
  user_id: number;
  session_title: string;
  status?: 'Active' | 'Completed' | 'Pending_Approval' | 'Approved' | 'Rejected' | 'Archived';
  linked_formula_id?: number;
  summary?: string;
  metadata?: any;
}

export interface UpdateChatSessionRequest {
  session_title?: string;
  end_time?: Date;
  status?: 'Active' | 'Completed' | 'Pending_Approval' | 'Approved' | 'Rejected' | 'Archived';
  linked_formula_id?: number;
  summary?: string;
  metadata?: any;
}

export interface ChatInteraction {
  interaction_id: number;
  chat_session_id: number;
  prompt: string;
  response: string;
  model_name: string;
  tokens_used: number;
  response_time_ms: number;
  created_on: Date;
}

export interface CreateChatInteractionRequest {
  chat_session_id: number;
  prompt: string;
  response: string;
  model_name: string;
  tokens_used: number;
  response_time_ms: number;
}

export interface ChatSessionWithInteractions extends ChatSession {
  interactions: ChatInteraction[];
  user_name?: string;
  formula_name?: string;
}
