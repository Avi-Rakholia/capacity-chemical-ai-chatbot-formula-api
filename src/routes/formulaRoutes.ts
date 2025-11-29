import { Router } from 'express';
import { 
  getAllFormulas, 
  getFormulaById, 
  createFormula, 
  updateFormula, 
  deleteFormula,
  addFormulaComponent,
  updateFormulaComponent,
  deleteFormulaComponent
} from '../controllers/formulaController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Formulas
 *   description: Chemical formula management endpoints
 */

/**
 * @swagger
 * /api/formulas:
 *   get:
 *     summary: Get all formulas
 *     tags: [Formulas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Pending, Approved, Rejected]
 *         description: Filter by formula status
 *       - in: query
 *         name: created_by
 *         schema:
 *           type: integer
 *         description: Filter by creator user ID
 *     responses:
 *       200:
 *         description: List of formulas retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Formula'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 */
router.get('/', getAllFormulas);

/**
 * @swagger
 * /api/formulas/{id}:
 *   get:
 *     summary: Get formula by ID with components
 *     tags: [Formulas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Formula ID
 *     responses:
 *       200:
 *         description: Formula retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   allOf:
 *                     - $ref: '#/components/schemas/Formula'
 *                     - type: object
 *                       properties:
 *                         components:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/FormulaComponent'
 *       404:
 *         description: Formula not found
 */
router.get('/:id', getFormulaById);

/**
 * @swagger
 * /api/formulas:
 *   post:
 *     summary: Create a new formula
 *     tags: [Formulas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [formula_name, created_by, density, total_cost, margin, container_cost]
 *             properties:
 *               formula_name: { type: string, example: "Chemical Formula A" }
 *               created_by: { type: integer, example: 1 }
 *               density: { type: number, example: 1.25 }
 *               total_cost: { type: number, example: 150.50 }
 *               margin: { type: number, example: 20.5 }
 *               container_cost: { type: number, example: 15.00 }
 *               status: { type: string, enum: [Draft, Pending, Approved, Rejected], default: "Draft" }
 *               components:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [chemical_name, percentage, cost_per_lb, hazard_class]
 *                   properties:
 *                     chemical_name: { type: string, example: "Sodium Chloride" }
 *                     percentage: { type: number, example: 25.5 }
 *                     cost_per_lb: { type: number, example: 5.50 }
 *                     hazard_class: { type: string, example: "Class 3" }
 *     responses:
 *       201:
 *         description: Formula created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Formula'
 */
router.post('/', createFormula);

/**
 * @swagger
 * /api/formulas/{id}:
 *   put:
 *     summary: Update formula
 *     tags: [Formulas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Formula ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               formula_name: { type: string }
 *               density: { type: number }
 *               total_cost: { type: number }
 *               margin: { type: number }
 *               container_cost: { type: number }
 *               status: { type: string, enum: [Draft, Pending, Approved, Rejected] }
 *     responses:
 *       200:
 *         description: Formula updated successfully
 */
router.put('/:id', updateFormula);

/**
 * @swagger
 * /api/formulas/{id}:
 *   delete:
 *     summary: Delete formula
 *     tags: [Formulas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Formula ID
 *     responses:
 *       200:
 *         description: Formula deleted successfully
 */
router.delete('/:id', deleteFormula);

// Formula components routes
/**
 * @swagger
 * /api/formulas/{id}/components:
 *   post:
 *     summary: Add component to formula
 *     tags: [Formulas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Formula ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chemical_name, percentage, cost_per_lb, hazard_class]
 *             properties:
 *               chemical_name: { type: string, example: "Sodium Chloride" }
 *               percentage: { type: number, example: 25.5 }
 *               cost_per_lb: { type: number, example: 5.50 }
 *               hazard_class: { type: string, example: "Class 3" }
 *     responses:
 *       201:
 *         description: Component added successfully
 */
router.post('/:id/components', addFormulaComponent);

/**
 * @swagger
 * /api/formulas/components/{componentId}:
 *   put:
 *     summary: Update formula component
 *     tags: [Formulas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Component ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chemical_name: { type: string }
 *               percentage: { type: number }
 *               cost_per_lb: { type: number }
 *               hazard_class: { type: string }
 *     responses:
 *       200:
 *         description: Component updated successfully
 */
router.put('/components/:componentId', updateFormulaComponent);

/**
 * @swagger
 * /api/formulas/components/{componentId}:
 *   delete:
 *     summary: Delete formula component
 *     tags: [Formulas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Component ID
 *     responses:
 *       200:
 *         description: Component deleted successfully
 */
router.delete('/components/:componentId', deleteFormulaComponent);

export default router;
