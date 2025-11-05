import Goal from '../models/goalsModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import { CreateGoalDto, UpdateGoalDto, AddCommentDto, GoalFilterDto, MinGoalDto } from '../models/dtos/goals/index.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de metas (goals)
 * @class GoalService
 */
export class GoalService {
  /**
   * Obtiene todas las metas del usuario autenticado con filtros opcionales
   * @static
   * @async
   * @function getAllGoals
   * @param {string} userId - ID del usuario autenticado
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

      // Convertir a DTO mínimo para listados
      const minGoals = MinGoalDto.fromArray(goals);

      return new SuccessResponseModel(minGoals, minGoals.length, 'Metas obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener metas:', error));
      return new ErrorResponseModel('Error al obtener metas');
    }
  }

  /**
   * Obtiene una meta específica por ID del usuario autenticado
   * @static
   * @async
   * @function getGoalById
   * @param {string} goalId - ID de la meta
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la meta o error
   * @description Incluye populate de userId (User) y parentGoalId (Goal)
   * El metricsId se devuelve como ID para que el frontend lo busque en el endpoint de métricas
   */
  static async getGoalById(goalId, userId) {
    try {
      const goal = await Goal.findOne({ _id: goalId, userId })
        .populate('userId', 'name email avatar')
        .populate('parentGoalId', 'description');
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
   * Crea una nueva meta para el usuario autenticado
   * @static
   * @async
   * @function createGoal
   * @param {Object} goalData - Datos de la meta
   * @param {string} goalData.title - Título de la meta
   * @param {string} goalData.description - Descripción de la meta
   * @param {string} goalData.priority - Prioridad de la meta
   * @param {Date} goalData.dueDate - Fecha límite
   * @param {Object} goalData.smart - Criterios SMART
   * @param {string} userId - ID del usuario autenticado
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
      return new CreatedResponseModel(savedGoal, 'Meta creada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al crear meta:', error));
      return new ErrorResponseModel('Error al crear meta');
    }
  }

  /**
   * Actualiza una meta existente del usuario autenticado
   * @static
   * @async
   * @function updateGoal
   * @param {string} goalId - ID de la meta
   * @param {Object} updateData - Datos a actualizar
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la meta actualizada o error
   */
  static async updateGoal(goalId, updateData, userId) {
    try {
      const updateDto = new UpdateGoalDto(updateData);
      const validation = updateDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = updateDto.toPlainObject();
      const goal = await Goal.findOneAndUpdate({ _id: goalId, userId }, cleanData, {
        new: true,
        runValidators: true,
      });

      if (!goal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }
      return new SuccessResponseModel(goal, 1, 'Meta actualizada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar meta:', error));
      return new ErrorResponseModel('Error al actualizar meta');
    }
  }

  /**
   * Elimina una meta del usuario autenticado
   * @static
   * @async
   * @function deleteGoal
   * @param {string} goalId - ID de la meta
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta de confirmación o error
   */
  static async deleteGoal(goalId, userId) {
    try {
      const goal = await Goal.findOneAndDelete({ _id: goalId, userId });
      if (!goal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }
      return new SuccessResponseModel({ id: goalId }, 1, 'Meta eliminada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar meta:', error));
      return new ErrorResponseModel('Error al eliminar meta');
    }
  }

  /**
   * Obtiene metas por estado del usuario autenticado
   * @static
   * @async
   * @function getGoalsByStatus
   * @param {string} status - Estado de las metas (active/paused/completed)
   * @param {string} userId - ID del usuario autenticado
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
   * Obtiene metas por ID de la meta padre del usuario autenticado
   * @static
   * @async
   * @function getGoalsByParentGoalId
   * @param {string} parentGoalId - ID de la meta padre
   * @param {string} userId - ID del usuario autenticado
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
   * Agrega un comentario a la meta del usuario autenticado
   * @static
   * @async
   * @function addComment
   * @param {string} goalId - ID de la meta
   * @param {Object} commentData - Datos del comentario
   * @param {string} commentData.text - Texto del comentario
   * @param {string} commentData.author - Autor del comentario
   * @param {string} userId - ID del usuario autenticado
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
}
