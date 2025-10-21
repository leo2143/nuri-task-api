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
      const userId = req.userId;
      const result = await MetricService.getAllMetrics(userId);
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
      const userId = req.userId;
      const result = await MetricService.getMetricById(id, userId);
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
      const userId = req.userId;
      const result = await MetricService.deleteMetric(id, userId);
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
      const userId = req.userId;
      const result = await MetricService.getMetricByGoalId(goalId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getMetricsByGoalId:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  // ========== GESTIÓN DE HITOS ==========

  /**
   * Agrega un hito a una métrica
   * @static
   * @async
   * @function addMilestone
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} req.body - Datos del hito
   * @param {string} req.body.name - Nombre del hito (requerido)
   * @param {number} [req.body.targetProgress] - Progreso objetivo (0-100)
   * @param {string} [req.body.description] - Descripción del hito
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async addMilestone(req, res) {
    try {
      const metricId = req.params.id;
      const milestoneData = req.body;
      const userId = req.userId;
      const result = await MetricService.addMilestone(metricId, milestoneData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en addMilestone:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Actualiza un hito específico de una métrica
   * @static
   * @async
   * @function updateMilestone
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {string} req.params.milestoneId - ID del hito
   * @param {Object} req.body - Datos a actualizar
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updateMilestone(req, res) {
    try {
      const metricId = req.params.id;
      const milestoneId = req.params.milestoneId;
      const updateData = req.body;
      const userId = req.userId;
      const result = await MetricService.updateMilestone(metricId, milestoneId, updateData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en updateMilestone:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina un hito de una métrica
   * @static
   * @async
   * @function deleteMilestone
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {string} req.params.milestoneId - ID del hito
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async deleteMilestone(req, res) {
    try {
      const metricId = req.params.id;
      const milestoneId = req.params.milestoneId;
      const userId = req.userId;
      const result = await MetricService.deleteMilestone(metricId, milestoneId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en deleteMilestone:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  // ========== GESTIÓN DE BLOQUEADORES ==========

  /**
   * Agrega un bloqueador a una métrica
   * @static
   * @async
   * @function addBlocker
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} req.body - Datos del bloqueador
   * @param {string} req.body.description - Descripción del bloqueador (requerido)
   * @param {string} [req.body.severity='medium'] - Severidad (low/medium/high/critical)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async addBlocker(req, res) {
    try {
      const metricId = req.params.id;
      const blockerData = req.body;
      const userId = req.userId;
      const result = await MetricService.addBlocker(metricId, blockerData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en addBlocker:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Resuelve un bloqueador de una métrica
   * @static
   * @async
   * @function resolveBlocker
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {string} req.params.blockerId - ID del bloqueador
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async resolveBlocker(req, res) {
    try {
      const metricId = req.params.id;
      const blockerId = req.params.blockerId;
      const userId = req.userId;
      const result = await MetricService.resolveBlocker(metricId, blockerId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en resolveBlocker:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina un bloqueador de una métrica
   * @static
   * @async
   * @function deleteBlocker
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {string} req.params.blockerId - ID del bloqueador
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async deleteBlocker(req, res) {
    try {
      const metricId = req.params.id;
      const blockerId = req.params.blockerId;
      const userId = req.userId;
      const result = await MetricService.deleteBlocker(metricId, blockerId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en deleteBlocker:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  // ========== GESTIÓN DE LOGROS SEMANALES ==========

  /**
   * Agrega un logro semanal a una métrica
   * @static
   * @async
   * @function addWeeklyWin
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} req.body - Datos del logro
   * @param {string} req.body.description - Descripción del logro (requerido)
   * @param {string} req.body.week - Semana del logro (requerido)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async addWeeklyWin(req, res) {
    try {
      const metricId = req.params.id;
      const winData = req.body;
      const userId = req.userId;
      const result = await MetricService.addWeeklyWin(metricId, winData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en addWeeklyWin:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina un logro semanal de una métrica
   * @static
   * @async
   * @function deleteWeeklyWin
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {string} req.params.winId - ID del logro semanal
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async deleteWeeklyWin(req, res) {
    try {
      const metricId = req.params.id;
      const winId = req.params.winId;
      const userId = req.userId;
      const result = await MetricService.deleteWeeklyWin(metricId, winId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en deleteWeeklyWin:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  // ========== GESTIÓN DE HISTORIAL ==========

  /**
   * Agrega una entrada al historial de la métrica
   * @static
   * @async
   * @function addHistoryEntry
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} req.body - Datos de la entrada del historial
   * @param {string} req.body.week - Semana (requerido)
   * @param {number} [req.body.progress] - Progreso (0-100)
   * @param {number} [req.body.timeInvested] - Tiempo invertido (horas)
   * @param {string} [req.body.mood] - Estado de ánimo
   * @param {Array} [req.body.achievements] - Logros de la semana
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
      console.error('Error en addHistoryEntry:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  // ========== GESTIÓN DE ALERTAS ==========

  /**
   * Confirma/marca como leída una alerta
   * @static
   * @async
   * @function acknowledgeAlert
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {string} req.params.alertId - ID de la alerta
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async acknowledgeAlert(req, res) {
    try {
      const metricId = req.params.id;
      const alertId = req.params.alertId;
      const userId = req.userId;
      const result = await MetricService.acknowledgeAlert(metricId, alertId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en acknowledgeAlert:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene las alertas no confirmadas de una métrica
   * @static
   * @async
   * @function getUnacknowledgedAlerts
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getUnacknowledgedAlerts(req, res) {
    try {
      const metricId = req.params.id;
      const userId = req.userId;
      const result = await MetricService.getUnacknowledgedAlerts(metricId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getUnacknowledgedAlerts:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  // ========== DASHBOARD Y PREDICCIONES ==========

  /**
   * Obtiene el dashboard completo de métricas
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
      console.error('Error en getMetricDashboard:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Actualiza las predicciones y métricas calculadas
   * @static
   * @async
   * @function updatePredictions
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la métrica
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updatePredictions(req, res) {
    try {
      const metricId = req.params.id;
      const userId = req.userId;
      const result = await MetricService.updatePredictions(metricId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en updatePredictions:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}
