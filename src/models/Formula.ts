export interface Formula {
  formula_id: number;
  formula_name: string;
  created_by: number;
  density: number;
  total_cost: number;
  margin: number;
  container_cost: number;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  created_on: Date;
  updated_on?: Date;
}

export interface CreateFormulaRequest {
  formula_name: string;
  created_by: number;
  density: number;
  total_cost: number;
  margin: number;
  container_cost: number;
  status?: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
}

export interface UpdateFormulaRequest {
  formula_name?: string;
  density?: number;
  total_cost?: number;
  margin?: number;
  container_cost?: number;
  status?: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
}

export interface FormulaWithComponents extends Formula {
  components: FormulaComponent[];
  creator_name?: string;
}

export interface FormulaComponent {
  component_id: number;
  formula_id: number;
  chemical_name: string;
  percentage: number;
  cost_per_lb: number;
  hazard_class: string;
}

export interface CreateFormulaComponentRequest {
  formula_id: number;
  chemical_name: string;
  percentage: number;
  cost_per_lb: number;
  hazard_class: string;
}
