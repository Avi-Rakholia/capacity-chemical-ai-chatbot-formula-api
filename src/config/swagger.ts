import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Capacity Chemical AI Chatbot API',
      version: '1.0.0',
      description: 'API for Capacity Chemical AI Chatbot Formula Management System',
      contact: {
        name: 'API Support',
        email: 'support@capacitychemical.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role_id: { type: 'integer', example: 1 },
            last_login: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['Active', 'Inactive'], example: 'Active' }
          }
        },
        UserWithRole: {
          type: 'object',
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                role_name: { type: 'string', example: 'capacity_admin' },
                permissions: { type: 'object', description: 'JSON object containing permissions' }
              }
            }
          ]
        },
        CreateUserRequest: {
          type: 'object',
          required: ['name', 'email', 'role_id'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role_id: { type: 'integer', example: 1 },
            status: { type: 'string', enum: ['Active', 'Inactive'], default: 'Active' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            role_id: { type: 'integer', example: 1 },
            role_name: { type: 'string', enum: ['capacity_admin', 'nsight_admin', 'user'] },
            permissions: { type: 'object', description: 'JSON object containing permissions' }
          }
        },
        Formula: {
          type: 'object',
          properties: {
            formula_id: { type: 'integer', example: 1 },
            formula_name: { type: 'string', example: 'Chemical Formula A' },
            created_by: { type: 'integer', example: 1 },
            density: { type: 'number', format: 'decimal', example: 1.25 },
            total_cost: { type: 'number', format: 'decimal', example: 150.50 },
            margin: { type: 'number', format: 'decimal', example: 20.5 },
            container_cost: { type: 'number', format: 'decimal', example: 15.00 },
            status: { type: 'string', enum: ['Draft', 'Pending', 'Approved', 'Rejected'] },
            created_on: { type: 'string', format: 'date-time' }
          }
        },
        FormulaComponent: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            formula_id: { type: 'integer', example: 1 },
            chemical_name: { type: 'string', example: 'Sodium Chloride' },
            percentage: { type: 'number', format: 'decimal', example: 25.5 },
            cost_per_lb: { type: 'number', format: 'decimal', example: 5.50 },
            hazard_class: { type: 'string', example: 'Class 3' }
          }
        },
        Quote: {
          type: 'object',
          properties: {
            quote_id: { type: 'integer', example: 1 },
            formula_id: { type: 'integer', example: 1 },
            created_by: { type: 'integer', example: 1 },
            customer_name: { type: 'string', example: 'ABC Company' },
            total_price: { type: 'number', format: 'decimal', example: 1500.00 },
            status: { type: 'string', enum: ['Draft', 'Pending_Approval', 'Approved', 'Rejected'] },
            template_id: { type: 'integer', example: 1 },
            created_on: { type: 'string', format: 'date-time' }
          }
        },
        ChatSession: {
          type: 'object',
          properties: {
            chat_session_id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            session_title: { type: 'string', example: 'Formula Discussion' },
            start_time: { type: 'string', format: 'date-time' },
            end_time: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['Active', 'Completed', 'Pending_Approval', 'Approved', 'Rejected', 'Archived'] },
            linked_formula_id: { type: 'integer', nullable: true },
            summary: { type: 'string', nullable: true },
            metadata: { type: 'object', nullable: true }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@example.com' },
            password: { type: 'string', example: 'password123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                user_id: { type: 'integer', example: 1 },
                name: { type: 'string', example: 'Capacity Admin User' },
                email: { type: 'string', example: 'admin@capacitychemical.com' },
                role_name: { type: 'string', example: 'capacity_admin' },
                permissions: { type: 'object' }
              }
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object', description: 'Response data' },
            message: { type: 'string', example: 'Operation successful' },
            error: { type: 'string', example: 'Error message if any' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            message: { type: 'string', example: 'Detailed error description' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API files
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'Capacity Chemical API Documentation',
    customfavIcon: '/assets/capacity-chemical.svg',
    customCss: `
      .swagger-ui .topbar { 
        background-color: #1976d2; 
      }
      .swagger-ui .topbar-wrapper .link {
        content: 'Capacity Chemical API';
      }
    `,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true
    }
  }));
  
  // Serve the raw OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log(`📚 API Documentation available at: http://localhost:${process.env.PORT || 3001}/api-docs`);
};

export { specs as swaggerSpecs };
