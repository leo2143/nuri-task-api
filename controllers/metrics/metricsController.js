import { MetricService } from '../../services/metricService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con métricas
 * @class MetricsController
 */
export class MetricsController {
  /**
   * Crea una nueva métrica
   * @static
   * @async
   * @function createMetric
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.body - Datos de la métrica a crear
   * @param {string} req.body.GoalId - ID de la meta (requerido)
   * @param {string} req.body.week - Semana (requerido)
   * @param {number} [req.body.progress=0] - Progreso (0-100)
   * @param {string} [req.body.notes=''] - Notas adicionales
   * @param {Date} [req.body.date] - Fecha de la métrica
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   * @example
   * // POST /api/metrics
   * // Body: { "GoalId": "123", "week": "Semana 1", "progress": 50, "notes": "Buen progreso" }
   */
  static async createMetric(req, res) {
    try {
      const metricData = req.body;
      const result = await MetricService.createMetric(metricData);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en createMetric:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Actualiza una métrica existente
   * @static
   * @async
   * @function updateMetric
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} req.body - Datos a actualizar
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updateMetric(req, res) {
    try {
      const id = req.params.id;
      const metricData = req.body;
      const result = await MetricService.updateMetric(id, metricData);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en updateMetric:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene todas las métricas con filtros opcionales
   * @static
   * @async
   * @function getAllMetrics
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.query - Query parameters para filtros
   * @param {string} [req.query.goalId] - Filtrar por ID de meta
   * @param {string} [req.query.week] - Filtrar por semana
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllMetrics(req, res) {
    try {
      // Extraer filtros de query parameters
      const filters = {
        goalId: req.query.goalId,
        week: req.query.week,
      };

      const result = await MetricService.getAllMetrics(filters);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getAllMetrics:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene una métrica por su ID
   * @static
   * @async
   * @function getMetricById
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getMetricById(req, res) {
    try {
      const id = req.params.id;
      const result = await MetricService.getMetricById(id);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getMetricById:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina una métrica por su ID
   * @static
   * @async
   * @function deleteMetric
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async deleteMetric(req, res) {
    try {
      const id = req.params.id;
      const result = await MetricService.deleteMetric(id);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en deleteMetric:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene todas las métricas de una meta específica
   * @static
   * @async
   * @function getMetricsByGoalId
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.goalId - ID de la meta
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getMetricsByGoalId(req, res) {
    try {
      const goalId = req.params.goalId;
      const result = await MetricService.getMetricsByGoalId(goalId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getMetricsByGoalId:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}
