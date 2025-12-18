export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash?: string;
  role_id: number;
  last_login?: Date;
  status: 'Active' | 'Inactive';
  created_on?: Date;
  updated_on?: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password_hash?: string;
  role_id: number;
  status?: 'Active' | 'Inactive';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password_hash?: string;
  role_id?: number;
  status?: 'Active' | 'Inactive';
}

export interface UserWithRole extends User {
  role_name: string;
  permissions: any;
}
