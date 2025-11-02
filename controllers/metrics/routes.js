import { MetricsController } from './metricsController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de métricas
 * @function setupMetricRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de métricas en la app
 * @description Configura las rutas de métricas protegidas con autenticación JWT
 */
export const setupMetricRoutes = app => {
  app.post('/api/metrics', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Crea una nueva métrica para una meta'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos de la métrica',
         required: true,
         schema: {
           GoalId: '507f1f77bcf86cd799439012',
           currentProgress: 0,
           notes: 'Comenzando seguimiento'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.createMetric(req, res);
  });

  app.get('/api/metrics', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Obtiene todas las métricas del usuario'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.getAllMetrics(req, res);
  });

  app.get('/api/metrics/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Obtiene una métrica por su ID'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la métrica',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.getMetricById(req, res);
  });

  app.put('/api/metrics/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Actualiza una métrica existente'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la métrica',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos a actualizar',
         schema: {
           currentProgress: 85,
           notes: 'Completé 3 módulos esta semana'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.updateMetric(req, res);
  });

  app.delete('/api/metrics/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Elimina una métrica'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la métrica',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.deleteMetric(req, res);
  });

  app.get('/api/goals/:goalId/metrics', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Obtiene la métrica de una meta específica'
    /* #swagger.parameters['goalId'] = {
         in: 'path',
         description: 'ID de la meta',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.getMetricsByGoalId(req, res);
  });

  app.get('/api/metrics/:id/dashboard', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Obtiene el dashboard motivacional de una métrica'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la métrica',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.getMetricDashboard(req, res);
  });

  app.post('/api/metrics/:id/history', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Agrega una entrada al historial de la métrica'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la métrica',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos del historial',
         required: true,
         schema: {
           progress: 65,
           date: '2025-11-01T10:00:00.000Z'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.addHistoryEntry(req, res);
  });
};
