import Metrics from '../models/metricsModel.js';
import User from '../models/userModel.js';
import Goal from '../models/goalsModel.js';
import Achievement from '../models/achievementModel.js';
import UserAchievement from '../models/userAchievementModel.js';
import { UserAchievementService } from './userAchievementService.js';
import { NotFoundResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel } from '../models/responseModel.js';
import { MetricsDashboardDto, CreateMetricDto } from '../models/dtos/metrics/index.js';
import { persistAndNotify } from './helpers/persistAndNotify.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { getLocalDayRange, resolveTimeZone, toLocalYmd } from './helpers/dateTime.js';
import { buildActivityDayPipeline } from './helpers/metricsActivityPipeline.js';
import { describeStreakTransition } from './helpers/streakDays.js';
import { PREMIUM_ACCESS_USER_SELECT, hasPremiumAccess, partitionByPremiumVisibility } from './helpers/premiumAccess.js';
import chalk from 'chalk';

const POPULATE_USER_FIELDS = 'name email avatar timezone';
const DUPLICATE_KEY_ERROR_CODE = 11000;
// Errores del driver que garantizan que la escritura nunca llegó al servidor: son los únicos que se reintentan
const UNSENT_WRITE_ERROR_NAMES = new Set([
  'MongoServerSelectionError',
  'MongoPoolClearedError',
  'MongoNotConnectedError',
]);

/**
 * Corre una escritura; solo la repite una vez si el driver garantiza que no llegó al servidor.
 * Un error de resultado desconocido (p. ej. corte de red tras enviarla) no se reintenta:
 * se prefiere perder un incremento antes que contarlo dos veces.
 * @param {() => Promise<*>} write
 * @returns {Promise<*>}
 */
async function runWriteRetryingOnlyIfUnsent(write) {
  try {
    return await write();
  } catch (error) {
    if (!UNSENT_WRITE_ERROR_NAMES.has(error?.name)) {
      throw error;
    }
    console.error(chalk.yellow('Escritura de métricas no enviada: reintento'), error);
    return write();
  }
}

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

      const owner = await User.findById(userId).select(PREMIUM_ACCESS_USER_SELECT).lean();
      const achievementsProgress = await this._calculateAchievementsProgress(userId, hasPremiumAccess(owner));

      const timeZone = resolveTimeZone(populatedMetrics.userId?.timezone);
      const response = {
        ...populatedMetrics.toObject(),
        currentStreak: populatedMetrics.getEffectiveStreak(timeZone),
        achievementsProgress,
      };

      return new SuccessResponseModel(response, 'Métricas del usuario obtenidas correctamente');
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
   * Registra una tarea completada en las métricas con UNA escritura atómica (día activo, racha, contadores).
   * Es lo único que se puede reintentar de una completada; los efectos posteriores van en `afterActivityMetrics`.
   * @param {string} userId
   * @param {Object} [context]
   * @param {Date} [context.occurredAt] - Instante de la completada (el `completedAt` del reclamo)
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} data: resultado de `_writeActivityMetrics`
   */
  static async writeTaskMetrics(userId, { occurredAt = new Date() } = {}) {
    return this._writeActivityMetrics(userId, 'task', occurredAt);
  }

  /**
   * Registra una meta completada: comparte con las tareas el mismo día activo, racha y escritura atómica.
   * @param {string} userId
   * @param {Object} [context]
   * @param {Date} [context.occurredAt] - Instante de la completada (el `firstCompletedAt` del reclamo)
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} data: resultado de `_writeActivityMetrics`
   */
  static async writeGoalMetrics(userId, { occurredAt = new Date() } = {}) {
    return this._writeActivityMetrics(userId, 'goal', occurredAt);
  }

  /**
   * Efectos posteriores a una escritura de métricas ya confirmada: notificación "Día N de racha" y evento
   * `streak:updated`. Cada paso va en su propio try/catch y NUNCA se reintenta, así un fallo de notificación
   * no puede volver a correr un incremento que ya se contó.
   * @param {string} userId
   * @param {{streakIncreased: boolean, currentStreak: number}} written - `data` de `writeTaskMetrics`/`writeGoalMetrics`
   * @returns {Promise<{achievementsUnlocked: Array}>}
   */
  static async afterActivityMetrics(userId, { streakIncreased, currentStreak }) {
    if (streakIncreased) {
      try {
        await persistAndNotify({
          userId,
          title: `¡Día ${currentStreak} de racha!`,
          body: '¡Seguiste sumando días, cada tarea cuenta. Seguí así!',
          url: '/metrics',
          type: 'streak_increase',
          icon: '/notifications/nuri-fire.svg',
        });
      } catch (error) {
        console.error(chalk.yellow('[side-effect] Error al notificar la racha:'), error);
      }
    }

    try {
      const streakEvent = await UserAchievementService.processEvent('streak:updated', userId, currentStreak);
      return { achievementsUnlocked: streakEvent?.achievementsUnlocked ?? [] };
    } catch (error) {
      console.error(chalk.yellow('[side-effect] Error al procesar logros de racha:'), error);
      return { achievementsUnlocked: [] };
    }
  }

  /**
   * Verifica el estado de las rachas. No escribe: la racha rota se resuelve al leer (racha efectiva).
   * @param {string} userId
   * @param {Object} [context]
   * @param {string|null} [context.timezone] - Zona del usuario (`req.userDoc.timezone`)
   */
  static async checkAndUpdateStreaks(userId, { timezone } = {}) {
    try {
      const metrics = await Metrics.findOne({ userId });

      if (!metrics) {
        return new NotFoundResponseModel('Métricas del usuario no encontradas');
      }

      const effectiveStreak = metrics.getEffectiveStreak(resolveTimeZone(timezone));
      const expired = metrics.currentStreak > 0 && effectiveStreak === 0;

      return new SuccessResponseModel(
        {
          currentStreak: effectiveStreak,
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

      const dashboard = MetricsDashboardDto.fromMetrics(metrics, resolveTimeZone(metrics.userId?.timezone));

      return new SuccessResponseModel(dashboard, 'Dashboard obtenido correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener dashboard');
    }
  }

  /**
   * Obtiene solo la racha actual del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} [context]
   * @param {string|null} [context.timezone] - Zona del usuario (`req.userDoc.timezone`)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   */
  static async getCurrentStreak(userId, { timezone } = {}) {
    try {
      const metrics = await Metrics.findOne({ userId }).select('currentStreak lastActivityDay');

      if (!metrics) {
        return new NotFoundResponseModel('Métricas del usuario no encontradas');
      }

      return new SuccessResponseModel(
        { currentStreak: metrics.getEffectiveStreak(resolveTimeZone(timezone)) },
        'Racha actual obtenida correctamente'
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener racha actual');
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
      const createDto = new CreateMetricDto({ userId: String(userId) });
      const validation = createDto.validate();
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      metrics = new Metrics(createDto.toPlainObject());
      await metrics.save();
    }

    return metrics;
  }

  /**
   * Zona horaria del usuario (ART si todavía no tiene una).
   * @private
   * @param {string} userId
   * @returns {Promise<string>}
   */
  static async _findUserTimeZone(userId) {
    const user = await User.findById(userId).select('timezone').lean();
    return resolveTimeZone(user?.timezone);
  }

  /**
   * Escritura atómica de una actividad: día local en la zona del usuario, pipeline sobre el documento y,
   * a partir del documento previo que devuelve la MISMA operación, racha previa efectiva y si la racha subió.
   * @private
   * @param {string} userId
   * @param {'task'|'goal'} kind
   * @param {Date} occurredAt
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>}
   *   data: { day, currentStreak, bestStreak, lastActivityDay, prevEffectiveStreak, streakIncreased }
   */
  static async _writeActivityMetrics(userId, kind, occurredAt) {
    const action = kind === 'task' ? 'registrar tarea completada' : 'registrar meta completada';

    try {
      const timeZone = await this._findUserTimeZone(userId);
      const day = toLocalYmd(occurredAt, timeZone);
      const dayStart = getLocalDayRange(day, timeZone).start;

      const writeActivity = () =>
        Metrics.findOneAndUpdate({ userId }, buildActivityDayPipeline({ kind, day, dayStart, occurredAt }), {
          new: false,
        }).lean();

      let previous = await runWriteRetryingOnlyIfUnsent(writeActivity);
      if (!previous) {
        await this._createMetricsIfMissing(userId);
        previous = await runWriteRetryingOnlyIfUnsent(writeActivity);
      }
      if (!previous) {
        throw new Error('No se pudieron crear las métricas del usuario');
      }

      const transition = describeStreakTransition(previous, day);
      console.log(
        chalk.green(`Métricas actualizadas (${kind}) | Día: ${day} | Racha: ${transition.currentStreak} días`)
      );

      return new SuccessResponseModel(
        { day, ...transition },
        kind === 'task' ? 'Tarea registrada en métricas correctamente' : 'Meta registrada en métricas correctamente'
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, action);
    }
  }

  /**
   * Crea el documento de métricas si no existe. Dos completadas simultáneas de un usuario nuevo pueden
   * competir por crearlo: el que pierde (clave duplicada) simplemente sigue con el documento del ganador.
   * @private
   * @param {string} userId
   */
  static async _createMetricsIfMissing(userId) {
    try {
      await this._findOrCreateMetrics(userId);
    } catch (error) {
      if (error?.code !== DUPLICATE_KEY_ERROR_CODE) {
        throw error;
      }
    }
  }

  /**
   * Calcula el porcentaje de logros completados por el usuario.
   * Un usuario sin acceso Premium cuenta solo los logros básicos (total, completados y porcentaje); `premiumLocked` es
   * cuántos logros premium activos hay (0 para un usuario Premium, que los tiene todos en `total`).
   * @param {string} userId - ID del usuario
   * @param {boolean} isPremium - Si el usuario tiene acceso Premium (admin o suscripción activa)
   * @returns {Promise<Object>} { completed, total, percentage, premiumLocked }
   */
  static async _calculateAchievementsProgress(userId, isPremium) {
    const activeAchievements = await Achievement.find({ isActive: true }).select('_id tier').lean();
    const { visibleAchievements, premiumLocked } = partitionByPremiumVisibility(activeAchievements, isPremium);
    const activeIds = visibleAchievements.map(achievement => achievement._id);
    const totalCount = activeIds.length;

    const completedCount =
      totalCount === 0
        ? 0
        : await UserAchievement.countDocuments({
            user: userId,
            status: 'completed',
            achievement: { $in: activeIds },
          });

    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      completed: completedCount,
      total: totalCount,
      percentage,
      premiumLocked,
    };
  }
}
