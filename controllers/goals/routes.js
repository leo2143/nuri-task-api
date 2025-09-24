import { GoalController } from './goalController.js';
import { validarToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de metas (goals)
 * @function setupGoalRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de goals en la app
 * @description Configura todas las rutas relacionadas con metas, todas requieren autenticación
 */
export const setupGoalRoutes = app => {
  // Rutas básicas CRUD
  app.get('/api/goals', validarToken, GoalController.getAllGoals);
  app.get('/api/goals/active', validarToken, GoalController.getActiveGoals);
  app.get('/api/goals/paused', validarToken, GoalController.getPausedGoals);
  app.get('/api/goals/completed', validarToken, GoalController.getCompletedGoals);
  app.get('/api/goals/:id', validarToken, GoalController.getGoalById);
  app.post('/api/goals', validarToken, GoalController.createGoal);
  app.put('/api/goals/:id', validarToken, GoalController.updateGoal);
  app.delete('/api/goals/:id', validarToken, GoalController.deleteGoal);

  // Rutas específicas para métricas y comentarios
  app.post('/api/goals/:id/metrics', validarToken, GoalController.addWeeklyMetric);
  app.post('/api/goals/:id/comments', validarToken, GoalController.addComment);
};
