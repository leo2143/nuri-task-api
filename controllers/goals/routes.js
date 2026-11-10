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
    // #swagger.summary = 'Obtiene lista catalog de metas (id, título y estado)'
    // #swagger.description = 'Retorna id, título y estado de las metas, ideal para dropdowns y selects. excludeCompleted=true omite las completadas; excludeRelatedTo=<goalId> omite esa meta, sus ancestros y sus descendientes (400 si el id es inválido). Sin resultados responde 200 con lista vacía.'
    /* #swagger.parameters['excludeCompleted'] = {
         in: 'query',
         description: 'Si es true, omite las metas completadas',
         required: false,
         type: 'string'
    } */
    /* #swagger.parameters['excludeRelatedTo'] = {
         in: 'query',
         description: 'ID de una meta: se omiten ella, sus ancestros y sus descendientes',
         required: false,
         type: 'string'
    } */
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
             { id: '507f1f77bcf86cd799439011', title: 'Aprender Node.js', status: 'active' },
             { id: '507f1f77bcf86cd799439012', title: 'Dominar React', status: 'completed' },
             { id: '507f1f77bcf86cd799439013', title: 'Crear portafolio', status: 'paused' }
           ]
         }
    } */
    return GoalController.getCatalogGoals(req, res);
  });

  app.get('/api/goals/quota', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Obtiene el cupo de metas del usuario'
    // #swagger.description = 'Plan gratuito: máximo 6 metas en total (cualquier estado, subetas incluidas). Premium y admin: sin límite (limit null, canCreate true).'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    /* #swagger.responses[200] = {
         description: 'Cupo de metas obtenido correctamente',
         schema: {
           success: true,
           status: 200,
           message: 'Cupo de metas obtenido correctamente',
           data: { limit: 6, used: 4, canCreate: true }
         }
    } */
    return GoalController.getGoalQuota(req, res);
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
    // #swagger.description = 'Actualiza una meta completa. DEBES enviar title (requerido), los demás campos son opcionales. Si cambia el status, actualiza automáticamente el progreso de metas padre. Si la meta pasa a completed, la respuesta incluye meta.events (toast de logros). Cambiar status de completed a active reabre la meta con la misma lógica que POST /api/goals/:id/reopen. 409 si el nuevo padre está completado o si el vínculo formaría un ciclo.'
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

  app.patch('/api/goals/:id/status', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Actualiza solo el estado de una meta'
    // #swagger.description = 'active ↔ paused libre. completed solo si hay al menos un hijo (tarea o submeta), todas las tareas están hechas y todas las submetas completed. Una meta vacía no se cierra. paused no puede pasar a completed. completed solo puede volver a active (se resuelve con la misma lógica que POST /api/goals/:id/reopen); cualquier otra transición desde completed responde 400.'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la meta',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Nuevo estado de la meta',
         required: true,
         schema: {
           status: 'active'
         }
    } */
    /* #swagger.responses[200] = {
         description: 'Estado de la meta actualizado correctamente',
         schema: {
           success: true,
           status: 200,
           message: 'Estado de la meta actualizado correctamente',
           data: { $ref: '#/definitions/Goal' }
         }
    } */
    /* #swagger.responses[400] = {
         description: 'Transición inválida o la meta no cumple la regla de hijos para completed'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.updateGoalStatus(req, res);
  });

  app.post('/api/goals/:id/reopen', validateToken, (req, res) => {
    // #swagger.tags = ['Goals']
    // #swagger.summary = 'Reabre una meta completada'
    // #swagger.description = 'Pasa una meta completed a active sin tocar métricas, racha ni logros. Si la meta es parte de un padre también completed, ese padre (y los ancestros completed contiguos) se reabren primero. Conserva firstCompletedAt (lo sella si era null). 409 si la meta no está completada.'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la meta a reabrir',
         required: true,
         type: 'string'
    } */
    /* #swagger.responses[200] = {
         description: 'Meta reabierta correctamente',
         schema: {
           success: true,
           status: 200,
           message: 'Meta reabierta correctamente',
           data: { goal: { $ref: '#/definitions/Goal' }, cascaded: ['507f1f77bcf86cd799439011'] }
         }
    } */
    /* #swagger.responses[404] = {
         description: 'Meta no encontrada'
    } */
    /* #swagger.responses[409] = {
         description: 'La meta no está completada'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return GoalController.reopenGoal(req, res);
  });
};
