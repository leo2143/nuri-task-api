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
  // ========== RUTAS BÁSICAS DE MÉTRICAS ==========
  app.post('/api/metrics', validarToken, MetricsController.createMetric);
  app.get('/api/metrics', validarToken, MetricsController.getAllMetrics);
  app.get('/api/metrics/:id', validarToken, MetricsController.getMetricById);
  app.put('/api/metrics/:id', validarToken, MetricsController.updateMetric);
  app.delete('/api/metrics/:id', validarToken, MetricsController.deleteMetric);

  // Ruta especial para obtener métricas por meta
  app.get('/api/goals/:goalId/metrics', validarToken, MetricsController.getMetricsByGoalId);

  // ========== DASHBOARD Y PREDICCIONES ==========
  app.get('/api/metrics/:id/dashboard', validarToken, MetricsController.getMetricDashboard);
  app.post('/api/metrics/:id/predictions', validarToken, MetricsController.updatePredictions);

  // ========== GESTIÓN DE HITOS ==========
  app.post('/api/metrics/:id/milestones', validarToken, MetricsController.addMilestone);
  app.put('/api/metrics/:id/milestones/:milestoneId', validarToken, MetricsController.updateMilestone);
  app.delete('/api/metrics/:id/milestones/:milestoneId', validarToken, MetricsController.deleteMilestone);

  // ========== GESTIÓN DE BLOQUEADORES ==========
  app.post('/api/metrics/:id/blockers', validarToken, MetricsController.addBlocker);
  app.put('/api/metrics/:id/blockers/:blockerId/resolve', validarToken, MetricsController.resolveBlocker);
  app.delete('/api/metrics/:id/blockers/:blockerId', validarToken, MetricsController.deleteBlocker);

  // ========== GESTIÓN DE LOGROS SEMANALES ==========
  app.post('/api/metrics/:id/weekly-wins', validarToken, MetricsController.addWeeklyWin);
  app.delete('/api/metrics/:id/weekly-wins/:winId', validarToken, MetricsController.deleteWeeklyWin);

  // ========== GESTIÓN DE HISTORIAL ==========
  app.post('/api/metrics/:id/history', validarToken, MetricsController.addHistoryEntry);

  // ========== GESTIÓN DE ALERTAS ==========
  app.get('/api/metrics/:id/alerts', validarToken, MetricsController.getUnacknowledgedAlerts);
  app.put('/api/metrics/:id/alerts/:alertId/acknowledge', validarToken, MetricsController.acknowledgeAlert);
};
