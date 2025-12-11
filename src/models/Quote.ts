export interface Quote {
  quote_id: number;
  formula_id: number;
  created_by: number;
  customer_name: string;
  total_price: number;
  status: 'Draft' | 'Pending_Approval' | 'Approved' | 'Rejected';
  template_id: number;
  created_on: Date;
  updated_on?: Date;
}

export interface CreateQuoteRequest {
  formula_id: number;
  created_by: number;
  customer_name: string;
  total_price: number;
  template_id: number;
  status?: 'Draft' | 'Pending_Approval' | 'Approved' | 'Rejected';
}

export interface UpdateQuoteRequest {
  customer_name?: string;
  total_price?: number;
  status?: 'Draft' | 'Pending_Approval' | 'Approved' | 'Rejected';
  template_id?: number;
}

export interface QuoteTemplate {
  template_id: number;
  template_name: string;
  layout: any; // TEXT field in MySQL
  is_default: boolean;
  created_on?: Date;
}

export interface CreateQuoteTemplateRequest {
  template_name: string;
  layout: any;
  is_default?: boolean;
}

export interface QuoteWithDetails extends Quote {
  formula_name?: string;
  creator_name?: string;
  template_name?: string;
}
