import UserAchievement from '../models/userAchievementModel.js';
import Achievement from '../models/achievementModel.js';
import User from '../models/userModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel } from '../models/responseModel.js';
import { IncrementProgressDto } from '../models/dtos/achievements/index.js';
import { PaginationDto } from '../models/dtos/paginationDto.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { PushNotificationService } from './pushNotificationService.js';
import { NotificationService } from './notificationService.js';
import chalk from 'chalk';

const POPULATE_USER_FIELDS = 'name email avatar';
const DEFAULT_PROGRESS = {
  currentCount: 0,
  status: 'locked',
  unlockedAt: null,
  completedAt: null,
};

/**
 * Servicio para gestionar el progreso del usuario en logros
 */
export class UserAchievementService {
  /**
   * Obtiene todos los logros con el progreso del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con los logros y el progreso del usuario
   */
  static async getAllAchievementsWithProgress(userId, pagination = {}) {
    try {
      const paginationDto = new PaginationDto(pagination);

      const user = await User.findById(userId).select('subscription isAdmin').lean();
      const isPremium = user?.isAdmin || user?.subscription?.isActive;

      const query = { isActive: true };
      paginationDto.applyCursorToQuery(query);

      const achievements = await Achievement.find(query)
        .sort({ createdAt: -1 })
        .limit(paginationDto.limit + 1)
        .lean();

      const { results: paginatedAchievements, meta } = paginationDto.processPaginationResults(achievements);

      // Solo busco progreso para los logros que el usuario puede desbloquear
      const accessibleAchievementIds = paginatedAchievements
        .filter(achievement => isPremium || achievement.tier === 'basic')
        .map(achievement => achievement._id);

      const userProgressRecords = await UserAchievement.find({
        user: userId,
        achievement: { $in: accessibleAchievementIds },
      }).lean();

      const userProgressByAchievementId = new Map(
        userProgressRecords.map(progressRecord => [progressRecord.achievement.toString(), progressRecord])
      );

      const achievementsWithProgress = paginatedAchievements.map(achievement => {
        const isAccessible = isPremium || achievement.tier === 'basic';
        return {
          ...achievement,
          isAccessible,
          userProgress: isAccessible
            ? userProgressByAchievementId.get(achievement._id.toString()) || DEFAULT_PROGRESS
            : DEFAULT_PROGRESS,
        };
      });

      return new SuccessResponseModel(achievementsWithProgress, 'Logros obtenidos correctamente', 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener logros con progreso');
    }
  }

  /**
   * Obtiene el progreso del usuario en un logro específico
   * @param {string} userId - ID del usuario
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el progreso del usuario
   * Incluye populate de userId (User) y achievementId (Achievement)
   */
  static async getUserAchievementProgress(userId, achievementId) {
    try {
      const userAchievement = await UserAchievement.findOne({ user: userId, achievement: achievementId })
        .populate('user', POPULATE_USER_FIELDS)
        .populate('achievement');

      if (!userAchievement) {
        // Si no existe progreso, devolver valores por defecto
        const achievementData = await Achievement.findById(achievementId);
        if (!achievementData) {
          return new NotFoundResponseModel('Logro no encontrado');
        }

        return new SuccessResponseModel(
          {
            achievement: achievementData,
            ...DEFAULT_PROGRESS,
          },
          'Progreso de logro obtenido correctamente'
        );
      }

      return new SuccessResponseModel(userAchievement, 'Progreso de logro obtenido correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener progreso de logro');
    }
  }

  /**
   * Incrementa el progreso en un logro
   * @param {string} userId - ID del usuario
   * @param {string} achievementId - ID del logro
   * @param {number} [amount=1] - Cantidad a incrementar
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el progreso actualizado
   */
  static async incrementProgress(userId, achievementId, amount = 1) {
    try {
      const incrementDto = new IncrementProgressDto({ amount });
      const validation = incrementDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      // Verificar que el logro exista
      const achievementData = await Achievement.findById(achievementId);
      if (!achievementData) {
        return new NotFoundResponseModel('Logro no encontrado');
      }

      // Buscar o crear el logro del usuario
      let userAchievement = await UserAchievement.findOne({ user: userId, achievement: achievementId });

      if (!userAchievement) {
        userAchievement = new UserAchievement({
          user: userId,
          achievement: achievementId,
          currentCount: 0,
          status: 'locked',
        });
      }

      userAchievement.currentCount += amount;

      const wasCompleted = userAchievement.status === 'completed';

      if (userAchievement.currentCount >= achievementData.targetCount) {
        if (userAchievement.status === 'locked') {
          userAchievement.status = 'unlocked';
          userAchievement.unlockedAt = new Date();
        }

        userAchievement.status = 'completed';
        userAchievement.completedAt = new Date();
      }

      await userAchievement.save();

      await userAchievement.populate('achievement');

      return new SuccessResponseModel(userAchievement, 'Progreso actualizado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'incrementar progreso');
    }
  }

  /**
   * Obtiene estadísticas de logros del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>}
   */
  static async getUserStats(userId) {
    try {
      const totalAchievements = await Achievement.countDocuments({ isActive: true });
      const userProgress = await UserAchievement.find({ user: userId });

      const statusCounts = userProgress.reduce(
        (acc, progress) => {
          acc[progress.status] = (acc[progress.status] || 0) + 1;
          return acc;
        },
        { locked: 0, unlocked: 0, completed: 0 }
      );

      const notStarted = totalAchievements - userProgress.length;

      const stats = {
        total: totalAchievements,
        notStarted,
        locked: statusCounts.locked,
        unlocked: statusCounts.unlocked,
        completed: statusCounts.completed,
        completionRate: totalAchievements > 0 ? ((statusCounts.completed / totalAchievements) * 100).toFixed(2) : 0,
      };

      return new SuccessResponseModel(stats, 'Estadísticas de logros obtenidas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener estadísticas de logros');
    }
  }

  /**
   * Resetea el progreso del usuario en un logro (solo administradores)
   * @param {string} userId - ID del usuario
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la confirmación de eliminación
   */
  static async resetProgress(userId, achievementId) {
    try {
      const userAchievement = await UserAchievement.findOneAndDelete({ user: userId, achievement: achievementId });

      if (!userAchievement) {
        return new NotFoundResponseModel('No se encontró progreso para este logro');
      }

      return new SuccessResponseModel(userAchievement, 'Progreso reseteado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'resetear progreso');
    }
  }

  /**
   * Procesa un evento de usuario y actualiza el progreso en todos los logros que lo escuchan.
   * Se llama desde otros servicios (todoService, goalService, metricsService) sin interrumpir
   * el flujo principal: los errores aquí nunca rompen la respuesta al usuario.
   * @param {string} triggerEvent - Evento disparado ('task:completed', 'goal:completed', 'streak:updated')
   * @param {string} userId - ID del usuario que disparó el evento
   * @param {number|null} value - Solo para 'streak:updated': valor absoluto del streak actual
   */
  static async processEvent(triggerEvent, userId, value = null) {
    try {
      const shouldSetAbsoluteValue = triggerEvent === 'streak:updated';

      const matchingAchievements = await Achievement.find({ triggerEvent, isActive: true }).lean();
      if (!matchingAchievements.length) return;

      const progressUpdateOps = matchingAchievements.map(achievement => ({
        updateOne: {
          filter: { user: userId, achievement: achievement._id },
          update: shouldSetAbsoluteValue
            ? { $set: { currentCount: value } }
            : { $inc: { currentCount: 1 } },
          upsert: true,
        },
      }));

      await UserAchievement.bulkWrite(progressUpdateOps);

      await this._checkAndCompleteAchievements(userId, matchingAchievements, shouldSetAbsoluteValue);
    } catch (error) {
      console.error(chalk.red('Error al procesar evento de logros:'), error);
    }
  }

  /**
   * Después del bulkWrite revisa qué logros cruzaron el targetCount y los marca como completados.
   * En modo streak también revierte los que cayeron por debajo.
   * @private
   * @param {string} userId
   * @param {Array} achievements - Logros consultados (con _id y targetCount)
   * @param {boolean} shouldSetAbsoluteValue - true cuando el evento es streak:updated (asigna el valor en lugar de incrementar)
   */
  static async _checkAndCompleteAchievements(userId, achievements, shouldSetAbsoluteValue) {
    const achievementIds = achievements.map(achievement => achievement._id);
    const userProgressList = await UserAchievement.find({
      user: userId,
      achievement: { $in: achievementIds },
    });

    if (!userProgressList.length) return;

    const achievementById = new Map(achievements.map(achievement => [achievement._id.toString(), achievement]));
    const now = new Date();

    const completionOps = [];
    const revertOps = [];
    const achievementsJustCompleted = [];

    for (const userProgress of userProgressList) {
      const achievement = achievementById.get(userProgress.achievement.toString());
      if (!achievement) continue;

      const reachedTarget = userProgress.currentCount >= achievement.targetCount;

      if (reachedTarget && userProgress.status !== 'completed') {
        completionOps.push({
          updateOne: {
            filter: { _id: userProgress._id },
            update: {
              $set: {
                status: 'completed',
                completedAt: now,
                unlockedAt: userProgress.unlockedAt || now,
              },
            },
          },
        });
        achievementsJustCompleted.push(achievement);
      } else if (shouldSetAbsoluteValue && !reachedTarget && userProgress.status === 'completed') {
        revertOps.push({
          updateOne: {
            filter: { _id: userProgress._id },
            update: { $set: { status: 'locked', completedAt: null } },
          },
        });
      }
    }

    const allOps = [...completionOps, ...revertOps];
    if (allOps.length > 0) {
      await UserAchievement.bulkWrite(allOps);
    }

    for (const achievement of achievementsJustCompleted) {
      const payload = {
        title: '¡Nuevo logro desbloqueado!',
        body: achievement.title,
        url: '/achievements',
        icon: achievement.imageUrl,
      };

      Promise.all([
        NotificationService.createMany([{
          userId,
          title: payload.title,
          body: payload.body,
          url: payload.url,
          type: 'achievement_completed',
        }]),
        PushNotificationService.sendNotification(userId, payload),
      ]).catch(err => console.error(chalk.yellow('Error enviando notificación de logro:', err)));
    }
  }
}
