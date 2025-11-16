import { MetricsController } from './metricsController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de Metrics
 * @function setupMetricRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de métricas en la app
 * @description Configura las rutas de Metrics protegidas con autenticación JWT
 */
export const setupMetricRoutes = app => {
  app.get('/api/metrics', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Obtiene las métricas generales del usuario autenticado'
    // #swagger.description = 'Retorna rachas, totales de tareas/metas completadas y historial de actividad'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.getAllMetrics(req, res);
  });

  app.get('/api/metrics/dashboard', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Obtiene el dashboard motivacional del usuario'
    // #swagger.description = 'Incluye métricas, mensajes motivacionales y estadísticas'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.getMetricDashboard(req, res);
  });

  app.post('/api/metrics/check-streaks', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Verifica y actualiza las rachas del usuario'
    // #swagger.description = 'Comprueba si las rachas han expirado y las actualiza'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MetricsController.checkAndUpdateStreaks(req, res);
  });
};
