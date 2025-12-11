export interface Setting {
  setting_id: number;
  category: 'Branding' | 'DecisionTree' | 'QuoteTemplate' | 'AIConfig';
  key: string;
  value: any; // TEXT field in MySQL
  updated_by: number;
  updated_on?: Date;
}

export interface CreateSettingRequest {
  category: 'Branding' | 'DecisionTree' | 'QuoteTemplate' | 'AIConfig';
  key: string;
  value: any;
  updated_by: number;
}

export interface UpdateSettingRequest {
  value: any;
  updated_by: number;
}
