// User models
export * from './User';
export * from './Role';

// Formula models
export * from './Formula';

// Quote models
export * from './Quote';

// Chat models
export * from './Chat';

// Approval models
export * from './Approval';

// Resource models
export * from './Resource';

// Session and logging models
export * from './Session';

// Settings models
export * from './Setting';

// Common types and interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    user_id: number;
    name: string;
    email: string;
    role_name: string;
    permissions: any;
  };
}

export interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
  iat?: number;
  exp?: number;
}
