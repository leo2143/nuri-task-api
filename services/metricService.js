import Metrics from '../models/metricsModel.js';
import Goal from '../models/goalsModel.js';
import { NotFoundResponseModel, ErrorResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de métricas
 * @class MetricService
 * @description Cada meta tiene UNA métrica que se actualiza con el progreso
 */
export class MetricService {
  /**
   * Obtiene todas las métricas
   * @static
   * @async
   * @function getAllMetrics
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista de métricas o error
   */
  static async getAllMetrics() {
    try {
      const metrics = await Metrics.find({}).populate('GoalId', 'title description status').sort({ lastUpdated: -1 });

      if (metrics.length === 0) {
        return new NotFoundResponseModel('No se encontraron métricas');
      }

      return new SuccessResponseModel(metrics, metrics.length, 'Métricas obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener métricas:', error));
      return new ErrorResponseModel('Error al obtener métricas');
    }
  }

  /**
   * Obtiene la métrica específica por ID
   * @static
   * @async
   * @function getMetricById
   * @param {string} id - ID de la métrica
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica o error
   */
  static async getMetricById(id) {
    try {
      const metric = await Metrics.findById(id).populate('GoalId', 'title description status');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      return new SuccessResponseModel(metric, 1, 'Métrica obtenida correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener métrica:', error));
      return new ErrorResponseModel('Error al obtener métrica');
    }
  }

  /**
   * Crea una nueva métrica para una meta específica
   * @static
   * @async
   * @function createMetric
   * @param {Object} metricData - Datos de la métrica a crear
   * @param {string} metricData.GoalId - ID de la meta (requerido)
   * @param {string} metricData.currentWeek - Semana actual (requerido)
   * @param {number} [metricData.currentProgress=0] - Progreso actual (0-100)
   * @param {string} [metricData.currentNotes=''] - Notas actuales
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la métrica creada o error
   * @example
   * const metric = await MetricService.createMetric({
   *   GoalId: '68d1e7f577ec3fe8073cef21',
   *   currentWeek: 'Semana 1',
   *   currentProgress: 15,
   *   currentNotes: 'Buen inicio'
   * });
   */
  static async createMetric(metricData) {
    try {
      const { GoalId, currentWeek, currentProgress, currentNotes } = metricData;

      if (!GoalId) {
        return new ErrorResponseModel('El ID de la meta es requerido');
      }

      if (!currentWeek) {
        return new ErrorResponseModel('La semana actual es requerida');
      }

      // Verificar si ya existe una métrica para esta meta
      const existingMetric = await Metrics.findOne({ GoalId });
      if (existingMetric) {
        return new ErrorResponseModel('Ya existe una métrica para esta meta. Use actualizar en su lugar');
      }

      // Verificar que la meta existe
      const goal = await Goal.findById(GoalId);
      if (!goal) {
        return new ErrorResponseModel('La meta especificada no existe');
      }

      const metric = new Metrics({
        GoalId,
        currentWeek,
        currentProgress: currentProgress !== undefined ? currentProgress : 0,
        currentNotes: currentNotes || '',
        history: [],
        lastUpdated: new Date(),
      });

      const savedMetric = await metric.save();

      // Actualizar la meta con el ID de la métrica
      await Goal.findByIdAndUpdate(GoalId, { metricsId: savedMetric._id });

      const populatedMetric = await Metrics.findById(savedMetric._id).populate('GoalId', 'title description status');

      return new CreatedResponseModel(populatedMetric, 'Métrica creada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al crear métrica:', error));
      return new ErrorResponseModel('Error al crear métrica');
    }
  }

  /**
   * Actualiza la métrica existente y guarda el estado anterior en el historial
   * @static
   * @async
   * @function updateMetric
   * @param {string} id - ID de la métrica
   * @param {Object} metricData - Datos a actualizar
   * @param {string} [metricData.currentWeek] - Semana actual
   * @param {number} [metricData.currentProgress] - Progreso actual (0-100)
   * @param {string} [metricData.currentNotes] - Notas actuales
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async updateMetric(id, metricData) {
    try {
      const metric = await Metrics.findById(id);

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      const { currentWeek, currentProgress, currentNotes } = metricData;

      // Validar progreso si se proporciona
      if (currentProgress !== undefined) {
        if (currentProgress < 0 || currentProgress > 100) {
          return new ErrorResponseModel('El progreso debe estar entre 0 y 100');
        }
      }

      // Guardar el estado actual en el historial antes de actualizar
      if (currentWeek && currentWeek !== metric.currentWeek) {
        metric.history.push({
          week: metric.currentWeek,
          progress: metric.currentProgress,
          notes: metric.currentNotes,
          date: metric.lastUpdated,
        });
      }

      // Actualizar campos
      if (currentWeek !== undefined) metric.currentWeek = currentWeek;
      if (currentProgress !== undefined) metric.currentProgress = currentProgress;
      if (currentNotes !== undefined) metric.currentNotes = currentNotes;
      metric.lastUpdated = new Date();

      const updatedMetric = await metric.save();
      const populatedMetric = await Metrics.findById(updatedMetric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Métrica actualizada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar métrica:', error));
      return new ErrorResponseModel('Error al actualizar métrica');
    }
  }

  /**
   * Elimina una métrica por ID
   * @static
   * @async
   * @function deleteMetric
   * @param {string} id - ID de la métrica
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación de eliminación o error
   */
  static async deleteMetric(id) {
    try {
      const metric = await Metrics.findById(id);

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Eliminar la referencia en la meta
      await Goal.findByIdAndUpdate(metric.GoalId, { $unset: { metricsId: 1 } });

      await Metrics.findByIdAndDelete(id);

      return new SuccessResponseModel(metric, 1, 'Métrica eliminada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar métrica:', error));
      return new ErrorResponseModel('Error al eliminar métrica');
    }
  }

  /**
   * Obtiene la métrica de una meta específica
   * @static
   * @async
   * @function getMetricByGoalId
   * @param {string} goalId - ID de la meta
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica de la meta o error
   */
  static async getMetricByGoalId(goalId) {
    try {
      const metric = await Metrics.findOne({ GoalId: goalId }).populate('GoalId', 'title description status');

      if (!metric) {
        return new NotFoundResponseModel('No se encontró métrica para esta meta');
      }

      return new SuccessResponseModel(metric, 1, 'Métrica de la meta obtenida correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener métrica de la meta:', error));
      return new ErrorResponseModel('Error al obtener métrica de la meta');
    }
  }
}
