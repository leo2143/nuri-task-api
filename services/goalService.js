import Goal from '../models/goalsModel.js';
import Todo from '../models/todoModel.js';
import User from '../models/userModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel, ForbiddenResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import {
  CreateGoalDto,
  UpdateGoalDto,
  UpdateGoalStatusDto,
  AddSubgoalDto,
  GoalFilterDto,
  CatalogGoalDto,
} from '../models/dtos/goals/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { findOwnedGoal } from './helpers/goalOwnership.js';
import { UserAchievementService } from './userAchievementService.js';
import { MetricsService } from './metricsService.js';
import { runWithOneRetry, ensureSuccessWithRetry } from './helpers/runWithOneRetry.js';
import chalk from 'chalk';

const FREE_GOALS_LIMIT = 2;

const POPULATE_PARENT_TITLE = 'title';
const POPULATE_PARENT_DESCRIPTION = 'description';

/**
 * Servicio para manejar la lógica de negocio de metas (goals)
 */
export class GoalService {
  /**
   * Busca una meta por ID y usuario
   * @private
   */
  static async _findGoalByIdAndUser(goalId, userId) {
    return findOwnedGoal(goalId, userId);
  }

  /**
   * Detecta si el parentGoalId cambió
   * @private
   */
  static _detectParentGoalChange(currentGoal, cleanData) {
    const oldParentId = currentGoal.parentGoalId;
    const newParentId = cleanData.parentGoalId !== undefined ? cleanData.parentGoalId : oldParentId;

    return {
      changed: (oldParentId || newParentId) && oldParentId?.toString() !== newParentId?.toString(),
      oldParentId,
      newParentId,
    };
  }

  /**
   * Detecta si el status cambió
   * @private
   */
  static _detectStatusChange(currentGoal, cleanData) {
    return {
      changed: cleanData.status && cleanData.status !== currentGoal.status,
      oldStatus: currentGoal.status,
      newStatus: cleanData.status,
    };
  }

  /**
   * Maneja la actualización de contadores cuando cambia el parent
   * @private
   */
  static async _handleParentGoalUpdates(parentChange, userId) {
    if (!parentChange.changed) return;

    if (parentChange.oldParentId) {
      await this._updateParentGoalCounters(parentChange.oldParentId, userId, 'Meta padre anterior');
    }

    if (parentChange.newParentId) {
      await this._updateParentGoalCounters(parentChange.newParentId, userId, 'Nueva meta padre');
    }
  }

  /**
   * Actualiza los contadores de submetas de una meta padre
   * @param {string} parentGoalId - ID de la meta padre
   * @param {string} [label='Meta padre'] - Etiqueta para el log
   */
  static async _updateParentGoalCounters(parentGoalId, userId, label = 'Meta padre') {
    if (!parentGoalId) return;

    await runWithOneRetry(async () => {
      const parentGoal = await Goal.findOne({ _id: parentGoalId, userId });
      if (!parentGoal) return;

      await parentGoal.updateSubGoalCount();
      await parentGoal.save();
      console.log(
        chalk.blue(`${label} actualizada: ${parentGoal.completedSubGoals}/${parentGoal.totalSubGoals} sub-metas`)
      );
    }, `actualizar contadores de ${label.toLowerCase()}`);
  }

  /**
   * Obtiene todas las metas del usuario  con filtros opcionales
   * @param {string} userId - ID del usuario
   * @param {Object} [filters={}] - Filtros de búsqueda (status, priority, search, dueDateFrom, dueDateTo, sortBy, sortOrder)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista resumida de metas o error
   * Devuelve solo información mínima (id, title, status, priority, dueDate, parentGoalId, dates)
   * Para información completa, usar getGoalById
   */
  static async getAllGoals(userId, filters = {}) {
    try {
      const filterDto = new GoalFilterDto(filters);
      const validation = filterDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const query = { userId, ...filterDto.toMongoQuery() };
      const sort = filterDto.toMongoSort();

      const goals = await Goal.find(query)
        .populate('parentGoalId', POPULATE_PARENT_TITLE)
        .select('title status priority dueDate parentGoalId progress createdAt updatedAt')
        .sort(sort)
        .limit(filterDto.limit + 1)
        .lean();

      const { results, meta } = filterDto.processPaginationResults(goals);

      if (results.length === 0) {
        return new NotFoundResponseModel('No se encontraron metas para este usuario');
      }

      return new SuccessResponseModel(results, 'Metas obtenidas correctamente', 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener metas');
    }
  }

  /**
   * Obtiene una meta específica por ID del usuario
   * @param {string} goalId - ID de la meta
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la meta o error
   * Incluye populate de parentGoalId (Goal)
   */
  static async getGoalById(goalId, userId) {
    try {
      const goal = await Goal.findOne({ _id: goalId, userId }).populate('parentGoalId', POPULATE_PARENT_DESCRIPTION);
      if (!goal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }
      return new SuccessResponseModel(goal, 'Meta obtenida correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener meta');
    }
  }

  /**
   * Crea una nueva meta para el usuario
   * @param {Object} goalData - Datos de la meta
   * @param {string} goalData.title - Título de la meta
   * @param {string} goalData.description - Descripción de la meta
   * @param {string} goalData.priority - Prioridad de la meta
   * @param {Date} goalData.dueDate - Fecha límite
   * @param {string} goalData.reason - Razón de importancia de la meta
   * @param {string} userId - ID del usuario
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la meta creada o error
   */
  static async createGoal(goalData, userId) {
    try {
      const createDto = new CreateGoalDto(goalData);
      const validation = createDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const user = await User.findById(userId).select('subscription isAdmin').lean();
      if (!user.isAdmin && !user.subscription?.isActive) {
        const goalCount = await Goal.countDocuments({ userId });
        if (goalCount >= FREE_GOALS_LIMIT) {
          return new ForbiddenResponseModel(
            `Alcanzaste el límite de ${FREE_GOALS_LIMIT} metas del plan gratuito. Suscribite para crear metas ilimitadas.`
          );
        }
      }

      const cleanData = createDto.toPlainObject();

      if (cleanData.parentGoalId) {
        const { error: parentError } = await this._findGoalByIdAndUser(cleanData.parentGoalId, userId);
        if (parentError) {
          return parentError;
        }
      }

      const goal = new Goal({
        ...cleanData,
        userId,
      });
      const savedGoal = await goal.save();

      if (savedGoal.parentGoalId) {
        await this._updateParentGoalCounters(savedGoal.parentGoalId, userId);
      }

      return new CreatedResponseModel(savedGoal, 'Meta creada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'crear meta');
    }
  }

  /**
   * Actualiza una meta existente del usuario
   * @param {string} goalId - ID de la meta
   * @param {Object} updateData - Datos completos de la meta (actualización completa)
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la meta actualizada o error
   * Actualización completa - requiere title. Detecta cambios en status y parentGoalId para actualizar contadores automáticamente
   */
  static async updateGoal(goalId, updateData, userId) {
    try {
      const updateDto = new UpdateGoalDto(updateData);
      const validation = updateDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      // Early return: Verificar que la meta existe
      const currentGoal = await Goal.findOne({ _id: goalId, userId });
      if (!currentGoal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }

      const cleanData = updateDto.toPlainObject();

      if (cleanData.parentGoalId) {
        if (cleanData.parentGoalId.toString() === goalId.toString()) {
          return new BadRequestResponseModel('Una meta no puede ser submeta de sí misma');
        }
        const { error: parentError } = await this._findGoalByIdAndUser(cleanData.parentGoalId, userId);
        if (parentError) {
          return parentError;
        }
      }

      const parentChange = this._detectParentGoalChange(currentGoal, cleanData);
      const statusChange = this._detectStatusChange(currentGoal, cleanData);

      const goal = await Goal.findOneAndUpdate({ _id: goalId, userId }, cleanData, {
        new: true,
        runValidators: true,
      });

      if (parentChange.changed) {
        await this._handleParentGoalUpdates(parentChange, userId);
      } else if (statusChange.changed && goal.parentGoalId) {
        await this._updateParentGoalCounters(goal.parentGoalId, userId);
        console.log(chalk.green(`Estado cambiado: ${statusChange.oldStatus} → ${statusChange.newStatus}`));
      }

      if (statusChange.changed && statusChange.newStatus === 'completed') {
        const metricsResult = await ensureSuccessWithRetry(
          await MetricsService.recordGoalCompleted(userId),
          () => MetricsService.recordGoalCompleted(userId),
          'registrar métricas de meta'
        );
        if (!metricsResult.success) {
          return metricsResult;
        }

        await UserAchievementService.processEvent('goal:completed', userId);
      }

      return new SuccessResponseModel(goal, 'Meta actualizada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar meta');
    }
  }

  /**
   * Elimina una meta del usuario
   * @param {string} goalId - ID de la meta
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta de confirmación o error
   */
  static async deleteGoal(goalId, userId) {
    try {
      const goal = await Goal.findOne({ _id: goalId, userId });

      if (!goal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }

      const parentGoalId = goal.parentGoalId;

      const now = new Date();
      await Todo.updateMany({ GoalId: goalId, userId, deleted_at: null }, { deleted_at: now });

      goal.deleted_at = now;
      try {
        await goal.save();
      } catch (saveError) {
        await Todo.updateMany({ GoalId: goalId, userId, deleted_at: now }, { $set: { deleted_at: null } });
        throw saveError;
      }

      if (parentGoalId) {
        await this._updateParentGoalCounters(parentGoalId, userId);
      }

      return new SuccessResponseModel({ id: goalId }, 'Meta eliminada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar meta');
    }
  }

  /**
   * Obtiene metas por estado del usuario
   * @param {string} status - Estado de las metas (active/paused/completed)
   * @param {string} userId - ID del usuario
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las metas filtradas o error
   */
  static async getGoalsByStatus(status, userId, pagination = {}) {
    try {
      const paginationDto = new GoalFilterDto(pagination);
      const query = { status, userId };
      paginationDto.applyCursorToQuery(query);

      const goals = await Goal.find(query)
        .sort(paginationDto.toMongoSort())
        .limit(paginationDto.limit + 1)
        .lean();

      const { results, meta } = paginationDto.processPaginationResults(goals);

      if (results.length === 0) {
        return new NotFoundResponseModel(`No se encontraron metas con estado: ${status}`);
      }
      return new SuccessResponseModel(results, `Metas ${status} obtenidas correctamente`, 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener metas por estado');
    }
  }

  /**
   * Obtiene metas por ID de la meta padre del usuario
   * @param {string} parentGoalId - ID de la meta padre
   * @param {string} userId - ID del usuario
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las metas filtradas o error
   */
  static async getGoalsByParentGoalId(parentGoalId, userId, pagination = {}) {
    try {
      const paginationDto = new GoalFilterDto(pagination);
      const query = { parentGoalId, userId };
      paginationDto.applyCursorToQuery(query);

      const goals = await Goal.find(query)
        .sort(paginationDto.toMongoSort())
        .limit(paginationDto.limit + 1)
        .lean();

      const { results, meta } = paginationDto.processPaginationResults(goals);

      if (results.length === 0) {
        return new NotFoundResponseModel(`No se encontraron metas con ID de meta padre: ${parentGoalId}`);
      }
      return new SuccessResponseModel(
        results,
        `Metas con ID de meta padre: ${parentGoalId} obtenidas correctamente`,
        200,
        meta
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener metas por ID de meta padre');
    }
  }

  /**
   * Agrega una submeta a una meta padre
   * @param {string} parentGoalId - ID de la meta padre (del parámetro URL)
   * @param {Object} body - Body con subgoalId
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   */
  static async addSubgoal(parentGoalId, body, userId) {
    try {
      const addDto = new AddSubgoalDto(body || {});
      const validation = addDto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { subgoalId } = addDto.toPlainObject();

      if (subgoalId === parentGoalId) {
        return new BadRequestResponseModel('Una meta no puede ser submeta de sí misma');
      }

      // Early return: Verificar que la meta padre existe
      const { goal: parentGoal, error: parentError } = await this._findGoalByIdAndUser(parentGoalId, userId);
      if (parentError) {
        return new NotFoundResponseModel('Meta padre no encontrada');
      }

      // Early return: Verificar que la submeta existe
      const { goal: subgoal, error: subgoalError } = await this._findGoalByIdAndUser(subgoalId, userId);
      if (subgoalError) {
        return new NotFoundResponseModel('Meta no encontrada');
      }

      const oldParentGoalId = subgoal.parentGoalId;

      subgoal.parentGoalId = parentGoalId;
      await subgoal.save();

      if (oldParentGoalId && oldParentGoalId.toString() !== parentGoalId) {
        await this._updateParentGoalCounters(oldParentGoalId, userId, 'Meta padre anterior');
      }

      await this._updateParentGoalCounters(parentGoalId, userId, 'Meta padre');

      return new SuccessResponseModel(subgoal, 'Submeta agregada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'agregar submeta');
    }
  }


  /**
   * Obtiene lista catalog de metas (solo id y título) del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con lista catalog de metas
   * Útilzado para selects
   */
  static async getCatalogGoals(userId) {
    try {
      const goals = await Goal.find({ userId }).select('_id title').sort({ createdAt: -1 });

      if (goals.length === 0) {
        return new NotFoundResponseModel('No se encontraron metas para este usuario');
      }

      const catalogGoals = CatalogGoalDto.fromArray(goals);

      return new SuccessResponseModel(catalogGoals, 'Catalogo de metas obtenida correctamente', 200, {
        count: catalogGoals.length,
      });
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener lista simple de metas');
    }
  }

  /**
   * Actualiza solo el estado de una meta
   * @param {string} goalId - ID de la meta
   * @param {Object} body - Body con status
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la meta actualizada o error
   */
  static async updateGoalStatus(goalId, body, userId) {
    try {
      const statusDto = new UpdateGoalStatusDto(body || {});
      const validation = statusDto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { status } = statusDto.toPlainObject();

      const goal = await Goal.findOne({ _id: goalId, userId });
      if (!goal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }

      const oldStatus = goal.status;
      goal.status = status;
      const updatedGoal = await goal.save();

      if (oldStatus !== status && goal.parentGoalId) {
        await this._updateParentGoalCounters(goal.parentGoalId, userId);
        console.log(chalk.green(`Estado cambiado: ${oldStatus} → ${status}`));
      }

      if (oldStatus !== status && status === 'completed') {
        await UserAchievementService.processEvent('goal:completed', userId);
      }

      return new SuccessResponseModel(updatedGoal, 'Estado de la meta actualizado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar estado de meta');
    }
  }
}
