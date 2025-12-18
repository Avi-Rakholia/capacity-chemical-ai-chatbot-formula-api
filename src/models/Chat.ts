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
  response?: string; // Nullable for streaming
  model_name?: string;
  tokens_used?: number; // Nullable until complete
  response_time_ms?: number; // Nullable until complete
  created_on: Date;
  attachments?: ChatAttachment[];
}

export interface CreateChatInteractionRequest {
  chat_session_id: number;
  prompt: string;
  response?: string;
  model_name: string;
  tokens_used?: number;
  response_time_ms?: number;
  attachments?: {
    type: 'local_file' | 'resource_reference';
    file_name?: string;
    file_url?: string;
    resource_id?: number;
    file_size?: string;
    mime_type?: string;
  }[];
}

export interface ChatAttachment {
  attachment_id: number;
  interaction_id: number;
  attachment_type: 'local_file' | 'resource_reference';
  file_name?: string;
  file_url?: string;
  resource_id?: number;  // Reference to Resources table
  file_size?: string;
  mime_type?: string;
  uploaded_on: Date;
}

export interface ChatSessionWithInteractions extends ChatSession {
  interactions: ChatInteraction[];
  user_name?: string;
  formula_name?: string;
}

export interface ChatTemplate {
  template_id: string;
  title: string;
  description: string;
  icon: string;
  prompt_template: string;
  category: 'formula' | 'quote' | 'search' | 'general';
}

export interface SendMessageRequest {
  session_id: number;
  user_id: number;
  message: string;
  attachments?: {
    type: 'local_file' | 'resource_reference';
    file_name?: string;
    file_url?: string;
    resource_id?: number;
    file_size?: string;
    mime_type?: string;
  }[];
}

export interface StreamChunk {
  chunk: string;
  done: boolean;
  session_id: number;
  interaction_id?: number;
  metadata?: any;
}
