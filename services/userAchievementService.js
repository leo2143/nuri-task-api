import UserAchievement from '../models/userAchievementModel.js';
import Achievement from '../models/achievementModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import { IncrementProgressDto } from '../models/dtos/achievements/index.js';
import chalk from 'chalk';

/**
 * Servicio para gestionar el progreso del usuario en logros
 * @class UserAchievementService
 */
export class UserAchievementService {
  /**
   * Obtiene todos los logros con el progreso del usuario
   * @static
   * @async
   * @function getAllAchievementsWithProgress
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con los logros y el progreso del usuario
   */
  static async getAllAchievementsWithProgress(userId) {
    try {
      // Obtener todos los logros activos
      const achievements = await Achievement.find({ isActive: true }).lean();

      // Obtener el progreso del usuario para todos los logros
      const userProgress = await UserAchievement.find({ userId }).lean();

      // Crear un mapa para búsquedas rápidas
      const progressMap = userProgress.reduce((acc, progress) => {
        acc[progress.achievementId.toString()] = progress;
        return acc;
      }, {});

      // Combinar logros con el progreso del usuario
      const result = achievements.map(achievement => ({
        ...achievement,
        userProgress: progressMap[achievement._id.toString()] || {
          currentCount: 0,
          status: 'locked',
          unlockedAt: null,
          completedAt: null,
        },
      }));

      return new SuccessResponseModel(result, result.length, 'Logros obtenidos correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener logros con progreso:', error));
      return new ErrorResponseModel('Error al obtener logros con progreso');
    }
  }

  /**
   * Obtiene el progreso del usuario en todos los logros
   * @static
   * @async
   * @function getUserProgress
   * @param {string} userId - ID del usuario
   * @param {string} [status] - Filtrar por estado (locked/unlocked/completed)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el progreso del usuario
   */
  static async getUserProgress(userId, status = null) {
    try {
      const query = { userId };
      if (status) {
        const validStatuses = ['locked', 'unlocked', 'completed'];
        if (!validStatuses.includes(status)) {
          return new ErrorResponseModel(`El estado debe ser uno de: ${validStatuses.join(', ')}`);
        }
        query.status = status;
      }

      const userAchievements = await UserAchievement.find(query).populate('achievementId').sort({ updatedAt: -1 });

      if (userAchievements.length === 0) {
        return new NotFoundResponseModel('No se encontró progreso de logros');
      }

      return new SuccessResponseModel(
        userAchievements,
        userAchievements.length,
        'Progreso de logros obtenido correctamente'
      );
    } catch (error) {
      console.error(chalk.red('Error al obtener progreso de logros:', error));
      return new ErrorResponseModel('Error al obtener progreso de logros');
    }
  }

  /**
   * Obtiene el progreso del usuario en un logro específico
   * @static
   * @async
   * @function getUserAchievementProgress
   * @param {string} userId - ID del usuario
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el progreso del usuario
   */
  static async getUserAchievementProgress(userId, achievementId) {
    try {
      const userAchievement = await UserAchievement.findOne({ userId, achievementId }).populate('achievementId');

      if (!userAchievement) {
        // Si no existe progreso, devolver valores por defecto
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
          return new NotFoundResponseModel('Logro no encontrado');
        }

        return new SuccessResponseModel(
          {
            achievement,
            currentCount: 0,
            status: 'locked',
            unlockedAt: null,
            completedAt: null,
          },
          1,
          'Progreso de logro obtenido correctamente'
        );
      }

      return new SuccessResponseModel(userAchievement, 1, 'Progreso de logro obtenido correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener progreso de logro:', error));
      return new ErrorResponseModel('Error al obtener progreso de logro');
    }
  }

  /**
   * Incrementa el progreso en un logro
   * @static
   * @async
   * @function incrementProgress
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
      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return new NotFoundResponseModel('Logro no encontrado');
      }

      // Buscar o crear el logro del usuario
      let userAchievement = await UserAchievement.findOne({ userId, achievementId });

      if (!userAchievement) {
        userAchievement = new UserAchievement({
          userId,
          achievementId,
          currentCount: 0,
          status: 'locked',
        });
      }

      userAchievement.currentCount += amount;

      if (userAchievement.currentCount >= achievement.targetCount) {
        if (userAchievement.status === 'locked') {
          userAchievement.status = 'unlocked';
          userAchievement.unlockedAt = new Date();
        }

        userAchievement.status = 'completed';
        userAchievement.completedAt = new Date();
      }

      await userAchievement.save();

      await userAchievement.populate('achievementId');

      return new SuccessResponseModel(userAchievement, 1, 'Progreso actualizado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al incrementar progreso:', error));
      return new ErrorResponseModel('Error al incrementar progreso');
    }
  }

  /**
   * Obtiene estadísticas de logros del usuario
   * @static
   * @async
   * @function getUserStats
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con las estadísticas
   */
  static async getUserStats(userId) {
    try {
      const totalAchievements = await Achievement.countDocuments({ isActive: true });
      const userProgress = await UserAchievement.find({ userId });

      const locked = userProgress.filter(p => p.status === 'locked').length;
      const unlocked = userProgress.filter(p => p.status === 'unlocked').length;
      const completed = userProgress.filter(p => p.status === 'completed').length;
      const notStarted = totalAchievements - userProgress.length;

      const stats = {
        total: totalAchievements,
        notStarted,
        locked,
        unlocked,
        completed,
        completionRate: totalAchievements > 0 ? ((completed / totalAchievements) * 100).toFixed(2) : 0,
      };

      return new SuccessResponseModel(stats, 1, 'Estadísticas de logros obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener estadísticas de logros:', error));
      return new ErrorResponseModel('Error al obtener estadísticas de logros');
    }
  }

  /**
   * Resetea el progreso del usuario en un logro (solo administradores)
   * @static
   * @async
   * @function resetProgress
   * @param {string} userId - ID del usuario
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la confirmación de eliminación
   */
  static async resetProgress(userId, achievementId) {
    try {
      const userAchievement = await UserAchievement.findOneAndDelete({ userId, achievementId });

      if (!userAchievement) {
        return new NotFoundResponseModel('No se encontró progreso para este logro');
      }

      return new SuccessResponseModel(userAchievement, 1, 'Progreso reseteado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al resetear progreso:', error));
      return new ErrorResponseModel('Error al resetear progreso');
    }
  }
}
