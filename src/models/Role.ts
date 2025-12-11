export interface Role {
  role_id: number;
  role_name: 'Admin' | 'Supervisor' | 'Chemist' | 'Sales' | 'Worker';
  permissions: any; // TEXT field in MySQL
  created_on?: Date;
}

export interface CreateRoleRequest {
  role_name: 'Admin' | 'Supervisor' | 'Chemist' | 'Sales' | 'Worker';
  permissions: any;
}

export interface UpdateRoleRequest {
  role_name?: 'Admin' | 'Supervisor' | 'Chemist' | 'Sales' | 'Worker';
  permissions?: any;
}
