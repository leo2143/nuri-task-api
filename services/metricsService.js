import Metrics from '../models/metricsModel.js';
import User from '../models/userModel.js';
import Goal from '../models/goalsModel.js';
import Achievement from '../models/achievementModel.js';
import UserAchievement from '../models/userAchievementModel.js';
import { NotFoundResponseModel, ErrorResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel } from '../models/responseModel.js';
import { MetricsDashboardDto } from '../models/dtos/metrics/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import chalk from 'chalk';

const POPULATE_USER_FIELDS = 'name email avatar';

/**
 * Servicio para manejar la lógica de negocio de métricas generales del usuario
 * Cada usuario tiene UNA métrica general que rastrea su actividad global
 */
export class MetricsService {
  /**
   * Obtiene o crea las métricas del usuario
   */
  static async getUserMetrics(userId) {
    try {
      const metrics = await this._findOrCreateMetrics(userId);
      const populatedMetrics = await Metrics.findById(metrics._id).populate('userId', POPULATE_USER_FIELDS);

      return new SuccessResponseModel(populatedMetrics, 'Métricas del usuario obtenidas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener métricas del usuario');
    }
  }

  /**
   * Actualiza las métricas del usuario
   */
  static async updateUserMetrics(userId, updateData) {
    try {
      const metrics = await this._findOrCreateMetrics(userId);

      if (updateData.notes !== undefined) {
        metrics.notes = updateData.notes;
      }

      await metrics.save();

      const populatedMetrics = await Metrics.findById(metrics._id).populate('userId', POPULATE_USER_FIELDS);

      return new SuccessResponseModel(populatedMetrics, 'Métricas actualizadas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar métricas');
    }
  }

  /**
   * Registra una tarea completada y actualiza rachas
   */
  static async recordTaskCompleted(userId) {
    try {
      const metrics = await this._findOrCreateMetrics(userId);

      metrics.onTaskCompleted();
      await metrics.save();

      console.log(
        chalk.green(
          `Métricas actualizadas: ${metrics.totalTasksCompleted} tareas | Racha: ${metrics.currentStreak} días`
        )
      );

      return new SuccessResponseModel(metrics, 'Tarea registrada en métricas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'registrar tarea completada');
    }
  }

  /**
   * Registra una meta completada
   */
  static async recordGoalCompleted(userId) {
    try {
      const metrics = await this._findOrCreateMetrics(userId);

      metrics.onGoalCompleted();
      await metrics.save();

      console.log(chalk.green(`Meta completada Total: ${metrics.totalGoalsCompleted} metas`));

      return new SuccessResponseModel(metrics, 'Meta registrada en métricas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'registrar meta completada');
    }
  }

  /**
   * Verifica y actualiza el estado de las rachas
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
        expired ? 'Racha expirada' : 'Racha activa'
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'verificar rachas');
    }
  }

  /**
   * Obtiene el dashboard completo de métricas del usuario
   */
  static async getDashboard(userId) {
    try {
      const metrics = await Metrics.findOne({ userId }).populate('userId', POPULATE_USER_FIELDS);

      if (!metrics) {
        return new NotFoundResponseModel('Métricas del usuario no encontradas');
      }

      const dashboard = MetricsDashboardDto.fromMetrics(metrics);

      return new SuccessResponseModel(dashboard, 'Dashboard obtenido correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener dashboard');
    }
  }

  /**
   * Elimina las métricas del usuario - solo para testing/admin
   */
  static async deleteUserMetrics(userId) {
    try {
      const metrics = await Metrics.findOneAndDelete({ userId });

      if (!metrics) {
        return new NotFoundResponseModel('Métricas del usuario no encontradas');
      }

      return new SuccessResponseModel({ userId }, 'Métricas eliminadas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar métricas');
    }
  }

  /**
   * Obtiene estadísticas generales del sistema para el dashboard de admin
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>}
   */
  static async getAdminDashboardStats() {
    try {
      const [totalUsers, subscribedUsers, totalGoals, totalAchievementTemplates, totalAchievementsCompleted] =
        await Promise.all([
          User.countDocuments(),
          User.countDocuments({ 'subscription.isActive': true }),
          Goal.countDocuments(),
          Achievement.countDocuments(),
          UserAchievement.countDocuments({ status: 'completed' }),
        ]);

      const stats = {
        totalUsers,
        subscribedUsers,
        totalGoals,
        totalAchievementTemplates,
        totalAchievementsCompleted,
      };

      return new SuccessResponseModel(stats, 'Estadísticas del dashboard obtenidas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener estadísticas del dashboard');
    }
  }

  /**
   * Busca o crea métricas para un usuario
   * @private
   */
  static async _findOrCreateMetrics(userId) {
    let metrics = await Metrics.findOne({ userId });

    if (!metrics) {
      metrics = new Metrics({ userId });
      await metrics.save();
    }

    return metrics;
  }
}
