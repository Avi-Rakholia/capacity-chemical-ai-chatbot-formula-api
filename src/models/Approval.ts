export interface Approval {
  approval_id: number;
  entity_type: 'Formula' | 'Quote';
  entity_id: number;
  approver_id: number;
  decision: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  decision_date: Date;
  comments?: string;
}

export interface CreateApprovalRequest {
  entity_type: 'Formula' | 'Quote';
  entity_id: number;
  approver_id: number;
  decision?: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  comments?: string;
}

export interface UpdateApprovalRequest {
  decision: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  comments?: string;
}

export interface ApprovalWithDetails extends Approval {
  approver_name?: string;
  entity_name?: string;
}
