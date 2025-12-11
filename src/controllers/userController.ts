import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { ApiResponse, PaginationParams } from '../models';

const userService = new UserService();

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, sortBy, sortOrder, status, role_id } = req.query;
    
    const params: PaginationParams & { status?: string; role_id?: number } = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: (sortBy as string) || 'username',
      sortOrder: (sortOrder as 'ASC' | 'DESC') || 'ASC',
      status: status as string,
      role_id: role_id ? parseInt(role_id as string) : undefined
    };

    const result = await userService.getAllUsers(params);
    
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Users retrieved successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting users:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to retrieve users'
    };
    res.status(500).json(response);
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid user ID'
      };
      res.status(400).json(response);
      return;
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      message: 'User retrieved successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting user:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to retrieve user'
    };
    res.status(500).json(response);
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = req.body;

    // Basic validation
    if (!userData.username || !userData.email || !userData.role_id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields: username, email, role_id'
      };
      res.status(400).json(response);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid email format'
      };
      res.status(400).json(response);
      return;
    }

    const newUser = await userService.createUser(userData);

    const response: ApiResponse<typeof newUser> = {
      success: true,
      data: newUser,
      message: 'User created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'Failed to create user';
    if (error instanceof Error) {
      if (error.message.includes('Email already exists')) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email already exists'
        };
        res.status(409).json(response);
        return;
      }
      errorMessage = error.message;
    }

    const response: ApiResponse<null> = {
      success: false,
      error: errorMessage
    };
    res.status(500).json(response);
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const updateData = req.body;

    if (isNaN(userId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid user ID'
      };
      res.status(400).json(response);
      return;
    }

    // Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid email format'
        };
        res.status(400).json(response);
        return;
      }
    }

    const updatedUser = await userService.updateUser(userId, updateData);

    if (!updatedUser) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    
    let errorMessage = 'Failed to update user';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Email already exists')) {
        errorMessage = 'Email already exists';
        statusCode = 409;
      } else {
        errorMessage = error.message;
      }
    }

    const response: ApiResponse<null> = {
      success: false,
      error: errorMessage
    };
    res.status(statusCode).json(response);
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid user ID'
      };
      res.status(400).json(response);
      return;
    }

    const deleted = await userService.deleteUser(userId);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'User deleted or deactivated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to delete user'
    };
    res.status(500).json(response);
  }
};

export const getUsersByRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid role ID'
      };
      res.status(400).json(response);
      return;
    }

    const users = await userService.getUsersByRole(roleIdNum);

    const response: ApiResponse<typeof users> = {
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting users by role:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to retrieve users'
    };
    res.status(500).json(response);
  }
};

export const getUsersWithFormulasCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getUsersWithFormulasCount();

    const response: ApiResponse<typeof users> = {
      success: true,
      data: users,
      message: 'Users with formulas count retrieved successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting users with formulas count:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to retrieve users with formulas count'
    };
    res.status(500).json(response);
  }
};

export const updateLastLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid user ID'
      };
      res.status(400).json(response);
      return;
    }

    await userService.updateLastLogin(userId);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Last login updated successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating last login:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to update last login'
    };
    res.status(500).json(response);
  }
};
