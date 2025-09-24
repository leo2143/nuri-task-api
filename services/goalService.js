import Goal from '../models/goalsModel.js';
import { NotFoundResponseModel, ErrorResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de metas (goals)
 * @class GoalService
 */
export class GoalService {
  /**
   * Obtiene todas las metas de un usuario específico
   * @static
   * @async
   * @function getAllGoals
 de las metas
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista de metas o error
   */
  static async getAllGoals(userId) {
    try {
      const goals = await Goal.find({}).sort({ createdAt: -1 });
      if (goals.length === 0) {
        return new NotFoundResponseModel('No se encontraron metas para este usuario');
      }
      return new SuccessResponseModel(goals, goals.length, 'Metas obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener metas:', error));
      return new ErrorResponseModel('Error al obtener metas');
    }
  }

  /**
   * Obtiene una meta específica por ID
   * @static
   * @async
   * @function getGoalById
   * @param {string} goalId - ID de la meta
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la meta o error
   */
  static async getGoalById(goalId) {
    try {
      const goal = await Goal.findOne({ _id: goalId });
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
   * Crea una nueva meta
   * @static
   * @async
   * @function createGoal
   * @param {Object} goalData - Datos de la meta
   * @param {string} goalData.title - Título de la meta
   * @param {string} goalData.description - Descripción de la meta
   * @param {string} goalData.priority - Prioridad de la meta
   * @param {Date} goalData.dueDate - Fecha límite
   * @param {Object} goalData.smart - Criterios SMART

   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la meta creada o error
   */
  static async createGoal(goalData, userId) {
    try {
      const goal = new Goal({
        ...goalData,
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
   * Actualiza una meta existente
   * @static
   * @async
   * @function updateGoal
   * @param {string} goalId - ID de la meta
   * @param {Object} updateData - Datos a actualizar

   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la meta actualizada o error
   */
  static async updateGoal(goalId, updateData, userId) {
    try {
      const goal = await Goal.findOneAndUpdate({ _id: goalId }, updateData, {
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
   * Elimina una meta
   * @static
   * @async
   * @function deleteGoal
   * @param {string} goalId - ID de la meta

   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta de confirmación o error
   */
  static async deleteGoal(goalId, userId) {
    try {
      const goal = await Goal.findOneAndDelete({ _id: goalId });
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
   * Obtiene metas por estado
   * @static
   * @async
   * @function getGoalsByStatus
   * @param {string} status - Estado de las metas (active/paused/completed)

   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las metas filtradas o error
   */
  static async getGoalsByStatus(status, userId) {
    try {
      const goals = await Goal.find({ status }).sort({ createdAt: -1 });
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
   * Agrega una métrica de progreso semanal
   * @static
   * @async
   * @function addWeeklyMetric
   * @param {string} goalId - ID de la meta
   * @param {Object} metricData - Datos de la métrica
   * @param {string} metricData.week - Semana (ej: "2024-W01")
   * @param {number} metricData.progress - Progreso (0-100)
   * @param {string} metricData.notes - Notas adicionales

   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la métrica agregada o error
   */
  static async addWeeklyMetric(goalId, metricData, userId) {
    try {
      const goal = await Goal.findOneAndUpdate(
        { _id: goalId },
        { $push: { metrics: metricData } },
        { new: true, runValidators: true }
      );

      if (!goal) {
        return new NotFoundResponseModel('Meta no encontrada');
      }
      return new SuccessResponseModel(goal, 1, 'Métrica agregada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al agregar métrica:', error));
      return new ErrorResponseModel('Error al agregar métrica');
    }
  }

  /**
   * Agrega un comentario a la meta
   * @static
   * @async
   * @function addComment
   * @param {string} goalId - ID de la meta
   * @param {Object} commentData - Datos del comentario
   * @param {string} commentData.text - Texto del comentario
   * @param {string} commentData.author - Autor del comentario

   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el comentario agregado o error
   */
  static async addComment(goalId, commentData, userId) {
    try {
      const goal = await Goal.findOneAndUpdate(
        { _id: goalId },
        { $push: { comments: commentData } },
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
