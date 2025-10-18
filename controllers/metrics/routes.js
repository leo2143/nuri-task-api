import { MetricsController } from './metricsController.js';
import { validarToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de métricas
 * @function setupMetricRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de métricas en la app
 * @description Configura las rutas de métricas protegidas con autenticación JWT
 */
export const setupMetricRoutes = app => {
  // Rutas de métricas (todas protegidas)
  app.post('/api/metrics', validarToken, MetricsController.createMetric);
  app.get('/api/metrics', validarToken, MetricsController.getAllMetrics);
  app.get('/api/metrics/:id', validarToken, MetricsController.getMetricById);
  app.put('/api/metrics/:id', validarToken, MetricsController.updateMetric);
  app.delete('/api/metrics/:id', validarToken, MetricsController.deleteMetric);

  // Ruta especial para obtener métricas por meta
  app.get('/api/goals/:goalId/metrics', validarToken, MetricsController.getMetricsByGoalId);
};
