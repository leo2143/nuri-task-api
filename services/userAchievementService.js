import UserAchievement from '../models/userAchievementModel.js';
import Achievement from '../models/achievementModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel } from '../models/responseModel.js';
import { IncrementProgressDto } from '../models/dtos/achievements/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';

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
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con los logros y el progreso del usuario
   */
  static async getAllAchievementsWithProgress(userId) {
    try {
      // Obtener todos los logros activos
      const achievements = await Achievement.find({ isActive: true }).lean();

      // Obtener el progreso del usuario para todos los logros
      const userProgress = await UserAchievement.find({ user: userId }).lean();

      const progressMap = new Map(userProgress.map(progress => [progress.achievement.toString(), progress]));

      // Combinar logros con el progreso del usuario
      const result = achievements.map(achievement => ({
        ...achievement,
        userProgress: progressMap.get(achievement._id.toString()) || DEFAULT_PROGRESS,
      }));

      return new SuccessResponseModel(result, result.length, 'Logros obtenidos correctamente');
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
          1,
          'Progreso de logro obtenido correctamente'
        );
      }

      return new SuccessResponseModel(userAchievement, 1, 'Progreso de logro obtenido correctamente');
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

      return new SuccessResponseModel(userAchievement, 1, 'Progreso actualizado correctamente');
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

      return new SuccessResponseModel(stats, 1, 'Estadísticas de logros obtenidas correctamente');
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

      return new SuccessResponseModel(userAchievement, 1, 'Progreso reseteado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'resetear progreso');
    }
  }
}
