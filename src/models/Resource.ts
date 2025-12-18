export interface Resource {
  resource_id: number;
  file_name: string;
  file_type: string;
  file_size: string;
  file_url: string;
  category: 'formulas' | 'quotes' | 'knowledge' | 'other';
  uploaded_by: number;
  uploaded_on: Date;
  description?: string;
  approval_status: 'Approved' | 'Pending' | 'Rejected';
  approved_by?: number;
  approved_on?: Date;
}

export interface CreateResourceRequest {
  file_name: string;
  file_type: string;
  file_size: string;
  file_url: string;
  category: 'formulas' | 'quotes' | 'knowledge' | 'other';
  uploaded_by: number;
  description?: string;
  approval_status?: 'Approved' | 'Pending' | 'Rejected';
}

export interface UpdateResourceRequest {
  file_name?: string;
  category?: 'formulas' | 'quotes' | 'knowledge' | 'other';
  description?: string;
  approval_status?: 'Approved' | 'Pending' | 'Rejected';
  approved_by?: number;
}

export interface ResourceWithDetails extends Resource {
  uploader_name?: string;
  approver_name?: string;
}
