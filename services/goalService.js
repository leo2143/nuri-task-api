import Goal from '../models/goalsModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import {
  CreateGoalDto,
  UpdateGoalDto,
  AddCommentDto,
  GoalFilterDto,
  MinGoalDto,
  CatalogGoalDto,
} from '../models/dtos/goals/index.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de metas (goals)
 * @class GoalService
 */
export class GoalService {
  /**
   * Actualiza los contadores de submetas de una meta padre
   * @static
   * @async
   * @private
   * @function _updateParentGoalCounters
   * @param {string} parentGoalId - ID de la meta padre
   * @param {string} [label='Meta padre'] - Etiqueta para el log
   * @returns {Promise<void>}
   * @description Función auxiliar para actualizar contadores de submetas
   */
  static async _updateParentGoalCounters(parentGoalId, label = 'Meta padre') {
    try {
      const parentGoal = await Goal.findById(parentGoalId);
      if (parentGoal) {
        await parentGoal.updateSubGoalCount();
        await parentGoal.save();
        console.log(
          chalk.blue(`${label} actualizada: ${parentGoal.completedSubGoals}/${parentGoal.totalSubGoals} sub-metas`)
        );
      }
    } catch (error) {
      console.error(chalk.yellow(`Error al actualizar contadores de ${label.toLowerCase()}:`, error));
    }
  }

  /**
   * Obtiene todas las metas del usuario  con filtros opcionales
   * @static
   * @async
   * @function getAllGoals
   * @param {string} userId - ID del usuario
   * @param {Object} [filters={}] - Filtros de búsqueda (status, priority, search, dueDateFrom, dueDateTo, sortBy, sortOrder)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista resumida de metas o error
   * @description Devuelve solo información mínima (id, title, status, priority, dueDate, parentGoalId, dates)
   * Para información completa incluyendo SMART, comentarios y métricas, usar getGoalById
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

      const goals = await Goal.find(query).populate('parentGoalId', 'title').sort(sort);
      if (goals.length === 0) {
        return new NotFoundResponseModel('No se encontraron metas para este usuario');
      }

      const minGoals = MinGoalDto.fromArray(goals);

      return new SuccessResponseModel(minGoals, minGoals.length, 'Metas obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener metas:', error));
      return new ErrorResponseModel('Error al obtener metas');
    }
  }

  /**
   * Obtiene una meta específica por ID del usuario
   * @static
   * @async
   * @function getGoalById
   * @param {string} goalId - ID de la meta
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la meta o error
   * @description Incluye populate de parentGoalId (Goal)
   */
  static async getGoalById(goalId, userId) {
    try {
      const goal = await Goal.findOne({ _id: goalId, userId }).populate('parentGoalId', 'description');
      if (!goal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }
      return new SuccessResponseModel(goal, 1, 'Meta obtenida correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener meta:', error));
      return new ErrorResponseModel('Error al obtener meta');
    }
  }

  /**
   * Crea una nueva meta para el usuario
   * @static
   * @async
   * @function createGoal
   * @param {Object} goalData - Datos de la meta
   * @param {string} goalData.title - Título de la meta
   * @param {string} goalData.description - Descripción de la meta
   * @param {string} goalData.priority - Prioridad de la meta
   * @param {Date} goalData.dueDate - Fecha límite
   * @param {Object} goalData.smart - Criterios SMART
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

      const cleanData = createDto.toPlainObject();
      const goal = new Goal({
        ...cleanData,
        userId,
      });
      const savedGoal = await goal.save();

      if (savedGoal.parentGoalId) {
        await this._updateParentGoalCounters(savedGoal.parentGoalId);
      }

      return new CreatedResponseModel(savedGoal, 'Meta creada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al crear meta:', error));
      return new ErrorResponseModel('Error al crear meta');
    }
  }

  /**
   * Actualiza una meta existente del usuario
   * @static
   * @async
   * @function updateGoal
   * @param {string} goalId - ID de la meta
   * @param {Object} updateData - Datos completos de la meta (actualización completa)
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la meta actualizada o error
   * @description Actualización completa - requiere title y smart. Detecta cambios en status y parentGoalId para actualizar contadores automáticamente
   */
  static async updateGoal(goalId, updateData, userId) {
    try {
      const updateDto = new UpdateGoalDto(updateData);
      const validation = updateDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      // Obtener la meta actual para detectar cambios
      const currentGoal = await Goal.findOne({ _id: goalId, userId });
      if (!currentGoal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }

      const cleanData = updateDto.toPlainObject();

      //verifico si el parentGoalId es igual al enviado
      const oldParentGoalId = currentGoal.parentGoalId;
      const newParentGoalId = cleanData.parentGoalId !== undefined ? cleanData.parentGoalId : oldParentGoalId;
      const parentGoalChanged =
        (oldParentGoalId || newParentGoalId) && oldParentGoalId?.toString() !== newParentGoalId?.toString();

      // verifico si cambio el status
      const statusChanged = cleanData.status && cleanData.status !== currentGoal.status;

      // actualizo la meta
      const goal = await Goal.findOneAndUpdate({ _id: goalId, userId }, cleanData, {
        new: true,
        runValidators: true,
      });

      // si cambio el parentGoalId -> se movió de meta padre
      if (parentGoalChanged) {
        // Actualizo contador del padre anterior
        if (oldParentGoalId) {
          await this._updateParentGoalCounters(oldParentGoalId, 'Meta padre anterior');
        }
        // Actualizo contador del nuevo padre
        if (newParentGoalId) {
          await this._updateParentGoalCounters(newParentGoalId, 'Nueva meta padre');
        }
      }
      // si cambio el status y tiene meta padre -> impacta en el progreso
      else if (statusChanged && goal.parentGoalId) {
        await this._updateParentGoalCounters(goal.parentGoalId);
        console.log(chalk.green(`Estado cambiado: ${currentGoal.status} → ${goal.status}`));
      }

      return new SuccessResponseModel(goal, 1, 'Meta actualizada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar meta:', error));
      return new ErrorResponseModel('Error al actualizar meta');
    }
  }

  /**
   * Elimina una meta del usuario
   * @static
   * @async
   * @function deleteGoal
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

      // Guardar el parentGoalId antes de eliminar
      const parentGoalId = goal.parentGoalId;

      // Eliminar la meta
      await Goal.findByIdAndDelete(goalId);

      // Si tenía una meta padre, actualizar sus contadores
      if (parentGoalId) {
        await this._updateParentGoalCounters(parentGoalId);
      }

      return new SuccessResponseModel({ id: goalId }, 1, 'Meta eliminada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar meta:', error));
      return new ErrorResponseModel('Error al eliminar meta');
    }
  }

  /**
   * Obtiene metas por estado del usuario
   * @static
   * @async
   * @function getGoalsByStatus
   * @param {string} status - Estado de las metas (active/paused/completed)
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las metas filtradas o error
   */
  static async getGoalsByStatus(status, userId) {
    try {
      const goals = await Goal.find({ status, userId }).sort({ createdAt: -1 });
      if (goals.length === 0) {
        return new NotFoundResponseModel(`No se encontraron metas con estado: ${status}`);
      }
      return new SuccessResponseModel(goals, goals.length, `Metas ${status} obtenidas correctamente`);
    } catch (error) {
      console.error(chalk.red('Error al obtener metas por estado:', error));
      return new ErrorResponseModel('Error al obtener metas por estado');
    }
  }
  /**
   * Obtiene metas por ID de la meta padre del usuario
   * @static
   * @async
   * @function getGoalsByParentGoalId
   * @param {string} parentGoalId - ID de la meta padre
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las metas filtradas o error
   */
  static async getGoalsByParentGoalId(parentGoalId, userId) {
    try {
      const goals = await Goal.find({ parentGoalId: parentGoalId, userId: userId }).sort({ createdAt: -1 });
      if (goals.length === 0) {
        return new NotFoundResponseModel(`No se encontraron metas con ID de meta padre: ${parentGoalId}`);
      }
      return new SuccessResponseModel(
        goals,
        goals.length,
        `Metas con ID de meta padre: ${parentGoalId} obtenidas correctamente`
      );
    } catch (error) {
      console.error(chalk.red('Error al obtener metas por ID de meta padre:', error));
      return new ErrorResponseModel('Error al obtener metas por ID de meta padre');
    }
  }

  /**
   * Agrega una submeta a una meta padre
   * @static
   * @async
   * @function addSubgoal
   * @param {string} parentGoalId - ID de la meta padre (del parámetro URL)
   * @param {string} subgoalId - ID de la meta que será submeta (del body)
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   */
  static async addSubgoal(parentGoalId, subgoalId, userId) {
    try {
      // Verificar que la meta padre existe
      const parentGoal = await Goal.findOne({ _id: parentGoalId, userId });
      if (!parentGoal) {
        return new NotFoundResponseModel('Meta padre no encontrada');
      }

      // Verificar que la submeta existe
      const subgoal = await Goal.findOne({ _id: subgoalId, userId });
      if (!subgoal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }

      if (subgoalId === parentGoalId) {
        return new BadRequestResponseModel('Una meta no puede ser submeta de sí misma');
      }

      const oldParentGoalId = subgoal.parentGoalId;

      // Actualizar el parentGoalId de la submeta
      subgoal.parentGoalId = parentGoalId;
      await subgoal.save();

      // Actualizar contador del padre anterior (si existía)
      if (oldParentGoalId && oldParentGoalId.toString() !== parentGoalId) {
        await this._updateParentGoalCounters(oldParentGoalId, 'Meta padre anterior');
      }

      // Actualizar contador de la nueva meta padre
      await this._updateParentGoalCounters(parentGoalId, 'Meta padre');

      return new SuccessResponseModel(subgoal, 1, 'Submeta agregada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al agregar submeta:', error));
      return new ErrorResponseModel('Error al agregar submeta');
    }
  }

  //TODO: los comentarios ya no van a ir dentro de la app, eliminarlos
  /**
   * Agrega un comentario a la meta del usuario
   * @static
   * @async
   * @function addComment
   * @param {string} goalId - ID de la meta
   * @param {Object} commentData - Datos del comentario
   * @param {string} commentData.text - Texto del comentario
   * @param {string} commentData.author - Autor del comentario
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el comentario agregado o error
   */
  static async addComment(goalId, commentData, userId) {
    try {
      const commentDto = new AddCommentDto(commentData);
      const validation = commentDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanComment = commentDto.toPlainObject();
      const goal = await Goal.findOneAndUpdate(
        { _id: goalId, userId },
        { $push: { comments: cleanComment } },
        { new: true, runValidators: true }
      );

      if (!goal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }
      return new SuccessResponseModel(goal, 1, 'Comentario agregado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al agregar comentario:', error));
      return new ErrorResponseModel('Error al agregar comentario');
    }
  }

  /**
   * Obtiene lista catalog de metas (solo id y título) del usuario
   * @static
   * @async
   * @function getCatalogGoals
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con lista catalog de metas
   * @description Útilzado para selects
   */
  static async getCatalogGoals(userId) {
    try {
      const goals = await Goal.find({ userId }).select('_id title').sort({ createdAt: -1 });

      if (goals.length === 0) {
        return new NotFoundResponseModel('No se encontraron metas para este usuario');
      }

      const catalogGoals = CatalogGoalDto.fromArray(goals);

      return new SuccessResponseModel(catalogGoals, catalogGoals.length, 'Catalogo de metas obtenida correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener lista simple de metas:', error));
      return new ErrorResponseModel('Error al obtener lista simple de metas');
    }
  }
}
