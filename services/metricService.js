import Metrics from '../models/metricsModel.js';
import Goal from '../models/goalsModel.js';
import {
  NotFoundResponseModel,
  ErrorResponseModel,
  BadRequestResponseModel,
} from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import {
  CreateMetricDto,
  UpdateMetricDto,
  AddMilestoneDto,
  AddBlockerDto,
  AddWeeklyWinDto,
  UpdateHistoryDto,
  ResolveBlockerDto,
  AcknowledgeAlertDto,
} from '../models/dtos/metrics/index.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de métricas
 * @class MetricService
 * @description Cada meta tiene UNA métrica que se actualiza con el progreso
 * Las métricas se filtran por userId a través de la relación con Goal
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
   */
  static async getMetricById(id, userId) {
    try {
      const metric = await Metrics.findById(id).populate('GoalId', 'title description status userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Verificar que la métrica pertenece a una meta del usuario
      if (metric.GoalId.userId.toString() !== userId) {
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
   * @param {string} metricData.currentWeek - Semana actual (requerido)
   * @param {number} [metricData.currentProgress=0] - Progreso actual (0-100)
   * @param {string} [metricData.currentNotes=''] - Notas actuales
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la métrica creada o error
   * @example
   * const metric = await MetricService.createMetric({
   *   GoalId: '68d1e7f577ec3fe8073cef21',
   *   currentWeek: 'Semana 1',
   *   currentProgress: 15,
   *   currentNotes: 'Buen inicio'
   * }, userId);
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
   * @param {string} [metricData.currentWeek] - Semana actual
   * @param {number} [metricData.currentProgress] - Progreso actual (0-100)
   * @param {string} [metricData.currentNotes] - Notas actuales
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

      const { currentWeek } = metricData;

      // Guardar el estado actual en el historial antes de actualizar
      if (currentWeek && currentWeek !== metric.currentWeek) {
        metric.history.push({
          week: metric.currentWeek,
          progress: metric.currentProgress,
          notes: metric.currentNotes,
          date: metric.lastUpdated,
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

  // ========== GESTIÓN DE HITOS ==========

  /**
   * Agrega un hito a una métrica
   * @static
   * @async
   * @function addMilestone
   * @param {string} metricId - ID de la métrica
   * @param {Object} milestoneData - Datos del hito
   * @param {string} milestoneData.name - Nombre del hito (requerido)
   * @param {number} [milestoneData.targetProgress] - Progreso objetivo (0-100)
   * @param {string} [milestoneData.description] - Descripción del hito
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async addMilestone(metricId, milestoneData, userId) {
    try {
      const milestoneDto = new AddMilestoneDto(milestoneData);
      const validation = milestoneDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Verificar que la métrica pertenece a una meta del usuario
      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Agregar el hito
      metric.milestones.push(milestoneDto.toPlainObject());
      await metric.save();

      const populatedMetric = await Metrics.findById(metric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Hito agregado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al agregar hito:', error));
      return new ErrorResponseModel('Error al agregar hito');
    }
  }

  /**
   * Actualiza un hito específico de una métrica
   * @static
   * @async
   * @function updateMilestone
   * @param {string} metricId - ID de la métrica
   * @param {string} milestoneId - ID del hito
   * @param {Object} updateData - Datos a actualizar
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async updateMilestone(metricId, milestoneId, updateData, userId) {
    try {
      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      const milestone = metric.milestones.id(milestoneId);
      if (!milestone) {
        return new NotFoundResponseModel('Hito no encontrado');
      }

      // Actualizar campos del hito
      if (updateData.name !== undefined) milestone.name = updateData.name;
      if (updateData.targetProgress !== undefined) milestone.targetProgress = updateData.targetProgress;
      if (updateData.description !== undefined) milestone.description = updateData.description;
      if (updateData.achieved !== undefined) {
        milestone.achieved = updateData.achieved;
        if (updateData.achieved) milestone.achievedDate = new Date();
      }

      await metric.save();

      const populatedMetric = await Metrics.findById(metric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Hito actualizado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar hito:', error));
      return new ErrorResponseModel('Error al actualizar hito');
    }
  }

  /**
   * Elimina un hito de una métrica
   * @static
   * @async
   * @function deleteMilestone
   * @param {string} metricId - ID de la métrica
   * @param {string} milestoneId - ID del hito
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación o error
   */
  static async deleteMilestone(metricId, milestoneId, userId) {
    try {
      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      const milestone = metric.milestones.id(milestoneId);
      if (!milestone) {
        return new NotFoundResponseModel('Hito no encontrado');
      }

      milestone.deleteOne();
      await metric.save();

      return new SuccessResponseModel(null, 0, 'Hito eliminado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar hito:', error));
      return new ErrorResponseModel('Error al eliminar hito');
    }
  }

  // ========== GESTIÓN DE BLOQUEADORES ==========

  /**
   * Agrega un bloqueador a una métrica
   * @static
   * @async
   * @function addBlocker
   * @param {string} metricId - ID de la métrica
   * @param {Object} blockerData - Datos del bloqueador
   * @param {string} blockerData.description - Descripción del bloqueador (requerido)
   * @param {string} [blockerData.severity='medium'] - Severidad (low/medium/high/critical)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async addBlocker(metricId, blockerData, userId) {
    try {
      const blockerDto = new AddBlockerDto(blockerData);
      const validation = blockerDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Agregar el bloqueador
      metric.blockers.push(blockerDto.toPlainObject());
      await metric.save();

      const populatedMetric = await Metrics.findById(metric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Bloqueador agregado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al agregar bloqueador:', error));
      return new ErrorResponseModel('Error al agregar bloqueador');
    }
  }

  /**
   * Resuelve un bloqueador de una métrica
   * @static
   * @async
   * @function resolveBlocker
   * @param {string} metricId - ID de la métrica
   * @param {string} blockerId - ID del bloqueador
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async resolveBlocker(metricId, blockerId, userId) {
    try {
      const resolveDto = new ResolveBlockerDto({ blockerId, resolved: true });
      const validation = resolveDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      const blocker = metric.blockers.id(blockerId);
      if (!blocker) {
        return new NotFoundResponseModel('Bloqueador no encontrado');
      }

      blocker.resolved = true;
      blocker.resolvedAt = new Date();

      await metric.save();

      const populatedMetric = await Metrics.findById(metric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Bloqueador resuelto correctamente');
    } catch (error) {
      console.error(chalk.red('Error al resolver bloqueador:', error));
      return new ErrorResponseModel('Error al resolver bloqueador');
    }
  }

  /**
   * Elimina un bloqueador de una métrica
   * @static
   * @async
   * @function deleteBlocker
   * @param {string} metricId - ID de la métrica
   * @param {string} blockerId - ID del bloqueador
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación o error
   */
  static async deleteBlocker(metricId, blockerId, userId) {
    try {
      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      const blocker = metric.blockers.id(blockerId);
      if (!blocker) {
        return new NotFoundResponseModel('Bloqueador no encontrado');
      }

      blocker.deleteOne();
      await metric.save();

      return new SuccessResponseModel(null, 0, 'Bloqueador eliminado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar bloqueador:', error));
      return new ErrorResponseModel('Error al eliminar bloqueador');
    }
  }

  // ========== GESTIÓN DE LOGROS SEMANALES ==========

  /**
   * Agrega un logro semanal a una métrica
   * @static
   * @async
   * @function addWeeklyWin
   * @param {string} metricId - ID de la métrica
   * @param {Object} winData - Datos del logro
   * @param {string} winData.description - Descripción del logro (requerido)
   * @param {string} winData.week - Semana del logro (requerido)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async addWeeklyWin(metricId, winData, userId) {
    try {
      const winDto = new AddWeeklyWinDto(winData);
      const validation = winDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Agregar el logro semanal
      metric.weeklyWins.push(winDto.toPlainObject());
      await metric.save();

      const populatedMetric = await Metrics.findById(metric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Logro semanal agregado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al agregar logro semanal:', error));
      return new ErrorResponseModel('Error al agregar logro semanal');
    }
  }

  /**
   * Elimina un logro semanal de una métrica
   * @static
   * @async
   * @function deleteWeeklyWin
   * @param {string} metricId - ID de la métrica
   * @param {string} winId - ID del logro semanal
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación o error
   */
  static async deleteWeeklyWin(metricId, winId, userId) {
    try {
      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      const win = metric.weeklyWins.id(winId);
      if (!win) {
        return new NotFoundResponseModel('Logro semanal no encontrado');
      }

      win.deleteOne();
      await metric.save();

      return new SuccessResponseModel(null, 0, 'Logro semanal eliminado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar logro semanal:', error));
      return new ErrorResponseModel('Error al eliminar logro semanal');
    }
  }

  // ========== GESTIÓN DE HISTORIAL ==========

  /**
   * Agrega una entrada al historial de la métrica
   * @static
   * @async
   * @function addHistoryEntry
   * @param {string} metricId - ID de la métrica
   * @param {Object} historyData - Datos de la entrada del historial
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async addHistoryEntry(metricId, historyData, userId) {
    try {
      const historyDto = new UpdateHistoryDto(historyData);
      const validation = historyDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Agregar entrada al historial
      metric.history.push(historyDto.toPlainObject());
      await metric.save();

      const populatedMetric = await Metrics.findById(metric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Entrada de historial agregada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al agregar entrada de historial:', error));
      return new ErrorResponseModel('Error al agregar entrada de historial');
    }
  }

  // ========== GESTIÓN DE ALERTAS ==========

  /**
   * Confirma/marca como leída una alerta
   * @static
   * @async
   * @function acknowledgeAlert
   * @param {string} metricId - ID de la métrica
   * @param {string} alertId - ID de la alerta
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async acknowledgeAlert(metricId, alertId, userId) {
    try {
      const acknowledgeDto = new AcknowledgeAlertDto({ alertId, acknowledged: true });
      const validation = acknowledgeDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      const alert = metric.alerts.id(alertId);
      if (!alert) {
        return new NotFoundResponseModel('Alerta no encontrada');
      }

      alert.acknowledged = true;
      await metric.save();

      const populatedMetric = await Metrics.findById(metric._id).populate('GoalId', 'title description status');

      return new SuccessResponseModel(populatedMetric, 1, 'Alerta confirmada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al confirmar alerta:', error));
      return new ErrorResponseModel('Error al confirmar alerta');
    }
  }

  /**
   * Obtiene las alertas no confirmadas de una métrica
   * @static
   * @async
   * @function getUnacknowledgedAlerts
   * @param {string} metricId - ID de la métrica
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las alertas o error
   */
  static async getUnacknowledgedAlerts(metricId, userId) {
    try {
      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId title');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      const unacknowledgedAlerts = metric.alerts.filter(alert => !alert.acknowledged);

      return new SuccessResponseModel(
        unacknowledgedAlerts,
        unacknowledgedAlerts.length,
        'Alertas no confirmadas obtenidas correctamente'
      );
    } catch (error) {
      console.error(chalk.red('Error al obtener alertas no confirmadas:', error));
      return new ErrorResponseModel('Error al obtener alertas no confirmadas');
    }
  }

  // ========== CÁLCULOS Y PREDICCIONES ==========

  /**
   * Actualiza las predicciones y métricas calculadas de una métrica
   * @static
   * @async
   * @function updatePredictions
   * @param {string} metricId - ID de la métrica
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica actualizada o error
   */
  static async updatePredictions(metricId, userId) {
    try {
      const metric = await Metrics.findById(metricId).populate('GoalId', 'userId createdAt dueDate');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Calcular progreso esperado
      if (metric.GoalId.createdAt && metric.GoalId.dueDate) {
        metric.expectedProgress = metric.calculateExpectedProgress(metric.GoalId.createdAt, metric.GoalId.dueDate);
      }

      // Calcular desviación
      metric.progressDeviation = metric.calculateProgressDeviation();

      // Calcular fecha proyectada de completado
      if (metric.GoalId.dueDate) {
        metric.projectedCompletionDate = metric.calculateProjectedCompletion(metric.GoalId.dueDate);
      }

      await metric.save();

      const populatedMetric = await Metrics.findById(metric._id).populate('GoalId', 'title description status dueDate');

      return new SuccessResponseModel(populatedMetric, 1, 'Predicciones actualizadas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar predicciones:', error));
      return new ErrorResponseModel('Error al actualizar predicciones');
    }
  }

  /**
   * Obtiene el dashboard completo de métricas para una meta
   * @static
   * @async
   * @function getMetricDashboard
   * @param {string} metricId - ID de la métrica
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el dashboard o error
   */
  static async getMetricDashboard(metricId, userId) {
    try {
      const metric = await Metrics.findById(metricId).populate('GoalId', 'title description status dueDate createdAt');

      if (!metric) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      if (metric.GoalId.userId.toString() !== userId) {
        return new NotFoundResponseModel('Métrica no encontrada');
      }

      // Construir dashboard completo
      const dashboard = {
        goalInfo: {
          id: metric.GoalId._id,
          title: metric.GoalId.title,
          description: metric.GoalId.description,
          status: metric.GoalId.status,
          dueDate: metric.GoalId.dueDate,
        },
        currentStatus: {
          week: metric.currentWeek,
          progress: metric.currentProgress,
          completedTasks: metric.totalCompletedTasks,
          totalTasks: metric.totalTasks,
          missingTasks: metric.missingTasks,
          notes: metric.currentNotes,
        },
        performance: {
          averageWeeklyProgress: metric.averageWeeklyProgress,
          progressTrend: metric.progressTrend,
          taskCompletionRate: metric.taskCompletionRate,
          efficiency: metric.efficiency,
          qualityScore: metric.qualityScore,
        },
        predictions: {
          expectedProgress: metric.expectedProgress,
          progressDeviation: metric.progressDeviation,
          projectedCompletionDate: metric.projectedCompletionDate,
        },
        streaks: {
          current: metric.currentStreak,
          best: metric.bestStreak,
        },
        health: {
          status: metric.healthStatus,
          isAtRisk: metric.isAtRisk,
          activeBlockers: metric.activeBlockersCount,
          unacknowledgedAlerts: metric.unacknowledgedAlertsCount,
        },
        tasks: {
          breakdown: metric.taskBreakdown,
          overdue: metric.overdueTasks,
          onTimeCompletionRate: metric.onTimeCompletionRate,
          completionPercentage: metric.currentCompletionPercentage,
        },
        milestones: metric.milestones,
        blockers: metric.blockers.filter(b => !b.resolved),
        recentWins: metric.weeklyWins.slice(-5), // Últimos 5 logros
        recentHistory: metric.history.slice(-4), // Últimas 4 semanas
        alerts: metric.alerts.filter(a => !a.acknowledged),
      };

      return new SuccessResponseModel(dashboard, 1, 'Dashboard obtenido correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener dashboard:', error));
      return new ErrorResponseModel('Error al obtener dashboard');
    }
  }
}
