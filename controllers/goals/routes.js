import { GoalController } from './goalController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de metas (goals)
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de goals en la app
   * Configura todas las rutas relacionadas con metas, todas requieren autenticación
 */
export const setupGoalRoutes = app => {
  app.get('/api/goals', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Obtiene todas las metas del usuario'
    // #swagger.description = 'Retorna todas las metas con campos de tracking (totalTasks, completedTasks, progress)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.getAllGoals(req, res);
  });

  app.get('/api/goals/catalogs', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Obtiene lista catalog de metas (solo id y título)'
    // #swagger.description = 'Retorna solo id y título de las metas, ideal para dropdowns y selects'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    /* #swagger.responses[200] = {
         description: 'Lista catalog de metas obtenida correctamente',
         schema: {
           success: true,
           status: 200,
           message: 'Lista simple de metas obtenida correctamente',
           count: 3,
           data: [
             { id: '507f1f77bcf86cd799439011', title: 'Aprender Node.js' },
             { id: '507f1f77bcf86cd799439012', title: 'Dominar React' },
             { id: '507f1f77bcf86cd799439013', title: 'Crear portafolio' }
           ]
         }
    } */
    return GoalController.getCatalogGoals(req, res);
  });

  app.get('/api/goals/active', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Obtiene todas las metas activas'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.getActiveGoals(req, res);
  });

  app.get('/api/goals/paused', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Obtiene todas las metas pausadas'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.getPausedGoals(req, res);
  });

  app.get('/api/goals/completed', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Obtiene todas las metas completadas'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.getCompletedGoals(req, res);
  });

  app.get('/api/goals/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Obtiene una meta por su ID'
    // #swagger.description = 'Retorna meta con userId y parentGoalId poblados, incluye campos de tracking'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la meta',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.getGoalById(req, res);
  });

  app.post('/api/goals', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Crea una nueva meta'
    // #swagger.description = 'Crea una nueva meta con campos de tracking inicializados en 0'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos de la meta (status se establece automáticamente en active)',
         required: true,
         schema: {
           title: 'Aprender Node.js',
           description: 'Dominar backend con Node.js',
           reason: 'Para mejorar mi carrera profesional',
           priority: 'high',
           dueDate: '2025-12-31T23:59:59.000Z'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.createGoal(req, res);
  });

  app.put('/api/goals/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Actualiza completamente una meta'
    // #swagger.description = 'Actualiza una meta completa. DEBES enviar title (requerido), los demás campos son opcionales. Si cambia el status, actualiza automáticamente el progreso de metas padre.'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la meta',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Todos los campos de la meta (actualización completa)',
         required: true,
         schema: {
           title: 'Aprender Node.js',
           description: 'Dominar backend con Node.js',
           reason: 'Para mejorar mi carrera profesional',
           status: 'active',
           priority: 'high',
           dueDate: '2025-12-31T23:59:59.000Z',
           parentGoalId: null
         }
    } */
    /* #swagger.responses[200] = {
         description: 'Meta actualizada correctamente',
         schema: {
           success: true,
           status: 200,
           message: 'Meta actualizada correctamente',
           data: { $ref: '#/definitions/Goal' }
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.updateGoal(req, res);
  });

  app.delete('/api/goals/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Elimina una meta'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la meta',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.deleteGoal(req, res);
  });

  app.get('/api/goals/:id/parent', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Obtiene las submetas de una meta padre'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la meta padre',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.getGoalsByParentGoalId(req, res);
  });

  app.patch('/api/goals/:id/subgoals', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Agrega una submeta a una meta padre'
    // #swagger.description = 'Convierte una meta existente en submeta de la meta especificada en la URL'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la meta padre (la meta que estás viendo)',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'ID de la meta que será submeta',
         required: true,
         schema: {
           subgoalId: '507f1f77bcf86cd799439011'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.addSubgoal(req, res);
  });
};
