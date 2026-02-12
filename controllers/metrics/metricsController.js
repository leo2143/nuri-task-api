import { MetricsService } from '../../services/metricsService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con Metrics
 * @class MetricsController
   * Gestiona métricas generales del usuario (rachas, totales, actividad)
 */
export class MetricsController {
  /**
   * Obtiene las métricas del usuario autenticado
   * @param {Object} req - Objeto request de Express
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   * Retorna las métricas generales del usuario (se auto-crea si no existe)
   */
  static async getAllMetrics(req, res) {
    try {
      const userId = req.userId;
      const result = await MetricsService.getUserMetrics(userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error al obtener métricas del usuario:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene el dashboard del usuario con estadísticas y motivación
   * @param {Object} req - Objeto request de Express
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getMetricDashboard(req, res) {
    try {
      const userId = req.userId;
      const result = await MetricsService.getDashboard(userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error al obtener dashboard del usuario:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Verifica y actualiza las rachas del usuario
   * @param {Object} req - Objeto request de Express
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async checkAndUpdateStreaks(req, res) {
    try {
      const userId = req.userId;
      const result = await MetricsService.checkAndUpdateStreaks(userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error al verificar rachas:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene solo la racha actual del usuario
   * @param {Object} req - Objeto request de Express
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getCurrentStreak(req, res) {
    try {
      const userId = req.userId;
      const result = await MetricsService.getCurrentStreak(userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error al obtener racha actual:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene estadísticas generales del sistema para el dashboard de admin
   * @param {Object} req - Objeto request de Express
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAdminDashboardStats(req, res) {
    const result = await MetricsService.getAdminDashboardStats();
    res.status(result.status).json(result);
  }
}
