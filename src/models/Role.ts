export interface Role {
  role_id: number;
  role_name: 'capacity_admin' | 'nsight_admin' | 'user';
  permissions?: any;
  created_on?: Date;
}

export interface CreateRoleRequest {
  role_name: 'capacity_admin' | 'nsight_admin' | 'user';
  permissions?: any;
}

export interface UpdateRoleRequest {
  role_name?: 'capacity_admin' | 'nsight_admin' | 'user';
  permissions?: any;
}
