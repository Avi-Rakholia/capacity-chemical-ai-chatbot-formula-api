import { Request, Response } from 'express';
import { FormulaService } from '../services/formulaService';
import { ApiResponse, PaginationParams } from '../models';

const formulaService = new FormulaService();

export const getAllFormulas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, sortBy, sortOrder, status, created_by } = req.query;
    
    const params: PaginationParams & { status?: string; created_by?: number } = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: (sortBy as string) || 'created_on',
      sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC',
      status: status as string,
      created_by: created_by ? parseInt(created_by as string) : undefined
    };

    const result = await formulaService.getAllFormulas(params);
    
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Formulas retrieved successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting formulas:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to retrieve formulas'
    };
    res.status(500).json(response);
  }
};

export const getFormulaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const formulaId = parseInt(id);

    if (isNaN(formulaId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid formula ID'
      };
      res.status(400).json(response);
      return;
    }

    const formula = await formulaService.getFormulaById(formulaId);

    if (!formula) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Formula not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof formula> = {
      success: true,
      data: formula,
      message: 'Formula retrieved successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting formula:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to retrieve formula'
    };
    res.status(500).json(response);
  }
};

export const createFormula = async (req: Request, res: Response): Promise<void> => {
  try {
    const formulaData = req.body;

    // Basic validation
    if (!formulaData.formula_name || !formulaData.created_by || !formulaData.density || 
        !formulaData.total_cost || !formulaData.margin || !formulaData.container_cost) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields'
      };
      res.status(400).json(response);
      return;
    }

    const newFormula = await formulaService.createFormula(formulaData);

    const response: ApiResponse<typeof newFormula> = {
      success: true,
      data: newFormula,
      message: 'Formula created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating formula:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create formula'
    };
    res.status(500).json(response);
  }
};

export const updateFormula = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const formulaId = parseInt(id);
    const updateData = req.body;

    if (isNaN(formulaId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid formula ID'
      };
      res.status(400).json(response);
      return;
    }

    const updatedFormula = await formulaService.updateFormula(formulaId, updateData);

    if (!updatedFormula) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Formula not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof updatedFormula> = {
      success: true,
      data: updatedFormula,
      message: 'Formula updated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating formula:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to update formula'
    };
    res.status(500).json(response);
  }
};

export const deleteFormula = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const formulaId = parseInt(id);

    if (isNaN(formulaId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid formula ID'
      };
      res.status(400).json(response);
      return;
    }

    const deleted = await formulaService.deleteFormula(formulaId);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Formula not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Formula deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting formula:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to delete formula'
    };
    res.status(500).json(response);
  }
};

export const addFormulaComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const formulaId = parseInt(id);
    const componentData = req.body;

    if (isNaN(formulaId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid formula ID'
      };
      res.status(400).json(response);
      return;
    }

    // Basic validation
    if (!componentData.chemical_name || !componentData.percentage || 
        !componentData.cost_per_lb || !componentData.hazard_class) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required component fields'
      };
      res.status(400).json(response);
      return;
    }

    componentData.formula_id = formulaId;
    const newComponent = await formulaService.addFormulaComponent(formulaId, componentData);

    const response: ApiResponse<typeof newComponent> = {
      success: true,
      data: newComponent,
      message: 'Formula component added successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding formula component:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to add formula component'
    };
    res.status(500).json(response);
  }
};

export const updateFormulaComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { componentId } = req.params;
    const componentIdNum = parseInt(componentId);
    const updateData = req.body;

    if (isNaN(componentIdNum)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid component ID'
      };
      res.status(400).json(response);
      return;
    }

    const updatedComponent = await formulaService.updateFormulaComponent(componentIdNum, updateData);

    if (!updatedComponent) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Formula component not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof updatedComponent> = {
      success: true,
      data: updatedComponent,
      message: 'Formula component updated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating formula component:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to update formula component'
    };
    res.status(500).json(response);
  }
};

export const deleteFormulaComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { componentId } = req.params;
    const componentIdNum = parseInt(componentId);

    if (isNaN(componentIdNum)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid component ID'
      };
      res.status(400).json(response);
      return;
    }

    const deleted = await formulaService.deleteFormulaComponent(componentIdNum);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Formula component not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Formula component deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting formula component:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to delete formula component'
    };
    res.status(500).json(response);
  }
};
