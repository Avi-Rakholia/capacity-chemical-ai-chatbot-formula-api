export interface User {
  user_id: number;
  name: string;
  email: string;
  role_id: number;
  last_login?: Date;
  status: 'Active' | 'Inactive';
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role_id: number;
  status?: 'Active' | 'Inactive';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role_id?: number;
  status?: 'Active' | 'Inactive';
}

export interface UserWithRole extends User {
  role_name: string;
  permissions: any;
}
