import Metrics from '../models/metricsModel.js';
import Goal from '../models/goalsModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import { CreateMetricDto, UpdateMetricDto } from '../models/dtos/metrics/index.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de métricas (simplificado - enfoque motivacional)
 * @class MetricService
 * @description Cada meta tiene UNA métrica que se actualiza con el progreso
 * Las métricas se filtran por userId a través de la relación con Goal
 * Enfoque motivacional: muestra avance y favorece constancia, sin evaluar rendimiento
 */
export class MetricService {
  /**
   * Obtiene todas las métricas del usuario autenticado
   * @static
   * @async
   * @function getAllMetrics
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista de métricas o error
   */
  static async getAllMetrics(userId) {
    try {
      // Primero obtener todas las metas del usuario
      const userGoals = await Goal.find({ userId }).select('_id');
      const goalIds = userGoals.map(goal => goal._id);

      // Luego obtener las métricas de esas metas
      const metrics = await Metrics.find({ GoalId: { $in: goalIds } })
        .populate('GoalId', 'title description status')
        .sort({ lastUpdated: -1 });

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
   * Obtiene la métrica específica por ID del usuario autenticado
   * @static
   * @async
   * @function getMetricById
   * @param {string} id - ID de la métrica
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica o error
   * @description Incluye populate de GoalId con populate anidado de userId
   */
  static async getMetricById(id, userId) {
    try {
      const metric = await Metrics.findById(id).populate({
        path: 'GoalId',
        populate: {
          path: 'userId',
          select: 'name email avatar',
        },
      });

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Verificar que la métrica pertenece a una meta del usuario
      if (metric.GoalId.userId._id.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      return new SuccessResponseModel(metric, 1, 'Métrica obtenida correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener métrica:', error));
      return new ErrorResponseModel('Error al obtener métrica');
    }
  }

  /**
   * Crea una nueva métrica para una meta específica del usuario autenticado
   * @static
   * @async
   * @function createMetric
   * @param {Object} metricData - Datos de la métrica a crear
   * @param {string} metricData.GoalId - ID de la meta (requerido)
   * @param {number} [metricData.currentProgress=0] - Progreso actual (0-100)
   * @param {string} [metricData.notes=''] - Notas opcionales
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la métrica creada o error
   */
  static async createMetric(metricData, userId) {
    try {
      const createDto = new CreateMetricDto(metricData);
      const validation = createDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { GoalId } = metricData;

      // Verificar si ya existe una métrica para esta meta
      const existingMetric = await Metrics.findOne({ GoalId });
      if (existingMetric) {
        return new ErrorResponseModel('Ya existe una métrica para esta meta. Use actualizar en su lugar');
      }

      // Verificar que la meta existe Y pertenece al usuario
      const goal = await Goal.findOne({ _id: GoalId, userId });
      if (!goal) {
        return new ErrorResponseModel('La meta especificada no existe o no tienes permisos para acceder a ella');
      }

      const cleanData = createDto.toPlainObject();
      const metric = new Metrics(cleanData);
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
   * @param {number} [metricData.currentProgress] - Progreso actual (0-100)
   * @param {string} [metricData.notes] - Notas opcionales
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async updateMetric(id, metricData, userId) {
    try {
      const updateDto = new UpdateMetricDto(metricData);
      const validation = updateDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const metric = await Metrics.findById(id).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Verificar que la métrica pertenece a una meta del usuario
      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Guardar el estado actual en el historial si hay progreso
      if (metricData.currentProgress !== undefined && metric.currentProgress > 0) {
        metric.history.push({
          progress: metric.currentProgress,
          date: new Date(),
        });
      }

      // Actualizar con datos limpios del DTO
      const cleanData = updateDto.toPlainObject();
      Object.assign(metric, cleanData);

      const updatedMetric = await metric.save();
      const populatedMetric = await Metrics.findById(updatedMetric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Métrica actualizada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar métrica:', error));
      return new ErrorResponseModel('Error al actualizar métrica');
    }
  }

  /**
   * Elimina una métrica por ID del usuario autenticado
   * @static
   * @async
   * @function deleteMetric
   * @param {string} id - ID de la métrica
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación de eliminación o error
   */
  static async deleteMetric(id, userId) {
    try {
      const metric = await Metrics.findById(id).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Verificar que la métrica pertenece a una meta del usuario
      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Eliminar la referencia en la meta
      await Goal.findByIdAndUpdate(metric.GoalId._id, { $unset: { metricsId: 1 } });

      await Metrics.findByIdAndDelete(id);

      return new SuccessResponseModel(metric, 1, 'Métrica eliminada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar métrica:', error));
      return new ErrorResponseModel('Error al eliminar métrica');
    }
  }

  /**
   * Obtiene la métrica de una meta específica del usuario autenticado
   * @static
   * @async
   * @function getMetricByGoalId
   * @param {string} goalId - ID de la meta
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica de la meta o error
   */
  static async getMetricByGoalId(goalId, userId) {
    try {
      // Verificar que la meta existe y pertenece al usuario
      const goal = await Goal.findOne({ _id: goalId, userId });
      if (!goal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }

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

  /**
   * Agrega una entrada al historial de la métrica
   * @static
   * @async
   * @function addHistoryEntry
   * @param {string} metricId - ID de la métrica
   * @param {Object} historyData - Datos de la entrada del historial
   * @param {number} historyData.progress - Progreso a registrar (0-100)
   * @param {Date} [historyData.date] - Fecha de la entrada (por defecto: ahora)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async addHistoryEntry(metricId, historyData, userId) {
    try {
      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Validar datos del historial
      if (historyData.progress === undefined || typeof historyData.progress !== 'number') {
        return new BadRequestResponseModel('El progreso es requerido y debe ser un número');
      }

      if (historyData.progress < 0 || historyData.progress > 100) {
        return new BadRequestResponseModel('El progreso debe estar entre 0 y 100');
      }

      // Agregar entrada al historial
      metric.history.push({
        progress: historyData.progress,
        date: historyData.date || new Date(),
      });

      await metric.save();

      const populatedMetric = await Metrics.findById(metric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Entrada de historial agregada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al agregar entrada de historial:', error));
      return new ErrorResponseModel('Error al agregar entrada de historial');
    }
  }

  /**
   * Obtiene el dashboard simplificado de métricas para una meta
   * @static
   * @async
   * @function getMetricDashboard
   * @param {string} metricId - ID de la métrica
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el dashboard o error
   */
  static async getMetricDashboard(metricId, userId) {
    try {
      const metric = await Metrics.findById(metricId).populate(
        'GoalId',
        'title description status dueDate createdAt userId'
      );

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Construir dashboard simplificado (motivacional)
      const dashboard = {
        goalInfo: {
          id: metric.GoalId._id,
          title: metric.GoalId.title,
          description: metric.GoalId.description,
          status: metric.GoalId.status,
        },
        currentProgress: metric.currentProgress,
        notes: metric.notes,
        streaks: {
          current: metric.currentStreak,
          best: metric.bestStreak,
        },
        history: metric.history,
      };

      return new SuccessResponseModel(dashboard, 1, 'Dashboard obtenido correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener dashboard:', error));
      return new ErrorResponseModel('Error al obtener dashboard');
    }
  }
}
