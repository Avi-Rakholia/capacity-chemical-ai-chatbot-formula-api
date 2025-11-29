export interface UserSession {
  session_id: number;
  user_id: number;
  login_time: Date;
  logout_time?: Date;
  ip_address: string;
  device_info: string;
  auth_method: 'SSO' | 'Password';
  token_id: string;
  status: 'Active' | 'Expired' | 'Terminated';
}

export interface CreateUserSessionRequest {
  user_id: number;
  ip_address: string;
  device_info: string;
  auth_method: 'SSO' | 'Password';
  token_id: string;
  status?: 'Active' | 'Expired' | 'Terminated';
}

export interface UpdateUserSessionRequest {
  logout_time?: Date;
  status?: 'Active' | 'Expired' | 'Terminated';
}

export interface ActivityLog {
  log_id: number;
  user_id: number;
  module: string;
  action: string;
  record_id?: number;
  timestamp: Date;
  ip_address: string;
}

export interface CreateActivityLogRequest {
  user_id: number;
  module: string;
  action: string;
  record_id?: number;
  ip_address: string;
}

export interface ApiLog {
  api_log_id: number;
  chat_session_id: number;
  endpoint: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  latency_ms: number;
  cost_usd: number;
  created_on: Date;
}

export interface CreateApiLogRequest {
  chat_session_id: number;
  endpoint: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  latency_ms: number;
  cost_usd: number;
}
