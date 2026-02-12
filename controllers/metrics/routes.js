import { MetricsController } from './metricsController.js';
import { validateToken, validateAdminToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de Metrics
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de métricas en la app
   * Configura las rutas de Metrics protegidas con autenticación JWT
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

  app.get('/api/metrics/current-streak', validateToken, (req, res) => {
    // #swagger.tags = ['Metrics']
    // #swagger.summary = 'Obtiene solo la racha actual del usuario'
    // #swagger.description = 'Retorna únicamente el valor de currentStreak para mostrar en el home'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    /* #swagger.responses[200] = {
         description: 'Racha actual obtenida correctamente',
         schema: {
           success: true,
           status: 200,
           message: 'Racha actual obtenida correctamente',
           data: {
             currentStreak: 5
           },
           meta: null
         }
    } */
    /* #swagger.responses[404] = {
         description: 'Métricas del usuario no encontradas',
         schema: {
           success: false,
           status: 404,
           message: 'Métricas del usuario no encontradas',
           data: null,
           meta: null
         }
    } */
    return MetricsController.getCurrentStreak(req, res);
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

  app.get('/api/admin/dashboard', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Metrics - Admin']
    // #swagger.summary = 'Obtiene estadísticas generales del sistema (solo admin)'
    // #swagger.description = 'Retorna contadores de usuarios, metas y logros del sistema completo'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    /* #swagger.responses[200] = {
         description: 'Estadísticas obtenidas correctamente',
         schema: {
           success: true,
           status: 200,
           message: 'Estadísticas del dashboard obtenidas correctamente',
           data: {
             totalUsers: 150,
             subscribedUsers: 45,
             totalGoals: 450,
             totalAchievementTemplates: 25,
             totalAchievementsCompleted: 380
           },
           meta: { count: 1 }
         }
    } */
    return MetricsController.getAdminDashboardStats(req, res);
  });
};
