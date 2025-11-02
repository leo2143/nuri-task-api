import { GoalController } from './goalController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de metas (goals)
 * @function setupGoalRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de goals en la app
 * @description Configura todas las rutas relacionadas con metas, todas requieren autenticación
 */
export const setupGoalRoutes = app => {
  app.get('/api/goals', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Obtiene todas las metas del usuario'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.getAllGoals(req, res);
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
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos de la meta',
         required: true,
         schema: {
           title: 'Aprender Node.js',
           description: 'Dominar backend con Node.js',
           status: 'active',
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
    // #swagger.summary = 'Actualiza una meta existente'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la meta',
         required: true,
         type: 'string'
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

  app.post('/api/goals/:id/comments', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Agrega un comentario a una meta'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la meta',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos del comentario',
         required: true,
         schema: {
           text: 'Avancé 50% esta semana',
           author: 'Juan Pérez'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.addComment(req, res);
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
};
