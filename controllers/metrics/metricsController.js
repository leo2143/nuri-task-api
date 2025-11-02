import { MetricService } from '../../services/metricService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con métricas (simplificado - enfoque motivacional)
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
   * @param {number} [req.body.currentProgress=0] - Progreso (0-100)
   * @param {string} [req.body.notes=''] - Notas opcionales
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async createMetric(req, res) {
    try {
      const metricData = req.body;
      const userId = req.userId;
      const result = await MetricService.createMetric(metricData, userId);
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
   * @param {number} [req.body.currentProgress] - Progreso (0-100)
   * @param {string} [req.body.notes] - Notas opcionales
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updateMetric(req, res) {
    try {
      const id = req.params.id;
      const metricData = req.body;
      const userId = req.userId;
      const result = await MetricService.updateMetric(id, metricData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en updateMetric:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene todas las métricas del usuario
   * @static
   * @async
   * @function getAllMetrics
   * @param {Object} req - Objeto request de Express
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllMetrics(req, res) {
    try {
      const userId = req.userId;
      const result = await MetricService.getAllMetrics(userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en al obtener todas las métricas:', error);
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
      const userId = req.userId;
      const result = await MetricService.getMetricById(id, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en al obtener la métrica por ID:', error);
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
      const userId = req.userId;
      const result = await MetricService.deleteMetric(id, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en al eliminar la métrica:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene la métrica de una meta específica
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
      const userId = req.userId;
      const result = await MetricService.getMetricByGoalId(goalId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en al obtener las métricas por ID de la meta:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Agrega una entrada al historial de la métrica
   * @static
   * @async
   * @function addHistoryEntry
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} req.body - Datos de la entrada del historial
   * @param {number} req.body.progress - Progreso (0-100, requerido)
   * @param {Date} [req.body.date] - Fecha de la entrada (por defecto: ahora)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async addHistoryEntry(req, res) {
    try {
      const metricId = req.params.id;
      const historyData = req.body;
      const userId = req.userId;
      const result = await MetricService.addHistoryEntry(metricId, historyData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en al agregar una entrada al historial de la métrica:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene el dashboard simplificado de métricas
   * @static
   * @async
   * @function getMetricDashboard
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getMetricDashboard(req, res) {
    try {
      const metricId = req.params.id;
      const userId = req.userId;
      const result = await MetricService.getMetricDashboard(metricId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en al obtener el dashboard de la métrica:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}
