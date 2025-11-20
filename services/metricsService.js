import Metrics from '../models/metricsModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de métricas generales del usuario
 * @class MetricsService
 * @description Cada usuario tiene UNA métrica general que rastrea su actividad global
 * Incluye: rachas, total de tareas completadas, total de metas completadas
 */
export class MetricsService {
  /**
   * Obtiene o crea las métricas del usuario autenticado
   * @static
   * @async
   * @function getUserMetrics
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con las métricas del usuario
   */
  static async getUserMetrics(userId) {
    try {
      let metrics = await Metrics.findOne({ userId }).populate('userId', 'name email avatar');

      // Si no existe, crear métricas iniciales
      if (!metrics) {
        metrics = new Metrics({ userId });
        await metrics.save();
        metrics = await Metrics.findOne({ userId }).populate('userId', 'name email avatar');
      }

      return new SuccessResponseModel(metrics, 1, 'Métricas del usuario obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener métricas del usuario:', error));
      return new ErrorResponseModel('Error al obtener métricas del usuario');
    }
  }

  /**
   * Actualiza las métricas del usuario
   * @static
   * @async
   * @function updateUserMetrics
   * @param {string} userId - ID del usuario autenticado
   * @param {Object} updateData - Datos a actualizar
   * @param {number} [updateData.currentProgress] - Progreso actual (0-100)
   * @param {string} [updateData.notes] - Notas opcionales
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las métricas actualizadas
   */
  static async updateUserMetrics(userId, updateData) {
    try {
      let metrics = await Metrics.findOne({ userId });

      if (!metrics) {
        metrics = new Metrics({ userId });
      }

      if (updateData.notes !== undefined) {
        metrics.notes = updateData.notes;
      }

      await metrics.save();

      const populatedMetrics = await Metrics.findOne({ userId }).populate('userId', 'name email avatar');

      return new SuccessResponseModel(populatedMetrics, 1, 'Métricas actualizadas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar métricas:', error));
      return new ErrorResponseModel('Error al actualizar métricas');
    }
  }

  /**
   * Registra una tarea completada y actualiza rachas
   * @static
   * @async
   * @function recordTaskCompleted
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con las métricas actualizadas
   */
  static async recordTaskCompleted(userId) {
    try {
      let metrics = await Metrics.findOne({ userId });

      if (!metrics) {
        metrics = new Metrics({ userId });
      }

      metrics.onTaskCompleted();
      await metrics.save();

      console.log(
        chalk.green(
          `Métricas actualizadas: ${metrics.totalTasksCompleted} tareas | Racha: ${metrics.currentStreak} días`
        )
      );

      return new SuccessResponseModel(metrics, 1, 'Tarea registrada en métricas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al registrar tarea completada:', error));
      return new ErrorResponseModel('Error al registrar tarea en métricas');
    }
  }

  /**
   * Registra una meta completada
   * @static
   * @async
   * @function recordGoalCompleted
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con las métricas actualizadas
   */
  static async recordGoalCompleted(userId) {
    try {
      let metrics = await Metrics.findOne({ userId });

      if (!metrics) {
        metrics = new Metrics({ userId });
      }

      metrics.onGoalCompleted();
      await metrics.save();

      console.log(chalk.green(`Meta completada Total: ${metrics.totalGoalsCompleted} metas`));

      return new SuccessResponseModel(metrics, 1, 'Meta registrada en métricas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al registrar meta completada:', error));
      return new ErrorResponseModel('Error al registrar meta en métricas');
    }
  }

  /**
   * Verifica y actualiza el estado de las rachas
   * @static
   * @async
   * @function checkAndUpdateStreaks
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con información de la racha
   */
  static async checkAndUpdateStreaks(userId) {
    try {
      const metrics = await Metrics.findOne({ userId });

      if (!metrics) {
        return new NotFoundResponseModel('Métricas del usuario no encontradas');
      }

      const expired = metrics.checkStreakExpiration();

      if (expired) {
        await metrics.save();
        console.log(chalk.yellow('Racha expirada y reseteada'));
      }

      return new SuccessResponseModel(
        {
          currentStreak: metrics.currentStreak,
          bestStreak: metrics.bestStreak,
          expired,
        },
        1,
        expired ? 'Racha expirada' : 'Racha activa'
      );
    } catch (error) {
      console.error(chalk.red('Error al verificar rachas:', error));
      return new ErrorResponseModel('Error al verificar rachas');
    }
  }

  /**
   * Obtiene el dashboard completo de métricas del usuario
   * @static
   * @async
   * @function getDashboard
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el dashboard
   */
  static async getDashboard(userId) {
    try {
      const metrics = await Metrics.findOne({ userId }).populate('userId', 'name email avatar');

      if (!metrics) {
        return new NotFoundResponseModel('Métricas del usuario no encontradas');
      }

      const dashboard = {
        user: {
          name: metrics.userId.name,
          email: metrics.userId.email,
        },
        activity: {
          totalTasksCompleted: metrics.totalTasksCompleted,
          totalGoalsCompleted: metrics.totalGoalsCompleted,
          lastActivityDate: metrics.lastActivityDate,
        },
        streaks: {
          current: metrics.currentStreak,
          best: metrics.bestStreak,
        },
        history: metrics.history.slice(-30),
      };

      return new SuccessResponseModel(dashboard, 1, 'Dashboard obtenido correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener dashboard:', error));
      return new ErrorResponseModel('Error al obtener dashboard');
    }
  }

  /**
   * Elimina las métricas del usuario (solo para testing/admin)
   * @static
   * @async
   * @function deleteUserMetrics
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación
   */
  static async deleteUserMetrics(userId) {
    try {
      const metrics = await Metrics.findOneAndDelete({ userId });

      if (!metrics) {
        return new NotFoundResponseModel('Métricas del usuario no encontradas');
      }

      return new SuccessResponseModel({ userId }, 1, 'Métricas eliminadas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar métricas:', error));
      return new ErrorResponseModel('Error al eliminar métricas');
    }
  }
}
