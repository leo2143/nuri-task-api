import UserAchievement from '../models/userAchievementModel.js';
import Achievement from '../models/achievementModel.js';
import {
  NotFoundResponseModel,
  ErrorResponseModel,
  BadRequestResponseModel,
} from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import { IncrementProgressDto } from '../models/dtos/achievements/index.js';
import chalk from 'chalk';

/**
 * Service to handle user progress on achievements
 * @class UserAchievementService
 */
export class UserAchievementService {
  /**
   * Gets all achievements with user progress
   * @static
   * @async
   * @function getAllAchievementsWithProgress
   * @param {string} userId - User ID
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Response with achievements and user progress
   */
  static async getAllAchievementsWithProgress(userId) {
    try {
      // Get all active achievements
      const achievements = await Achievement.find({ isActive: true }).lean();
      
      // Get user progress for all achievements
      const userProgress = await UserAchievement.find({ userId }).lean();
      
      // Create a map for quick lookup
      const progressMap = userProgress.reduce((acc, progress) => {
        acc[progress.achievementId.toString()] = progress;
        return acc;
      }, {});
      
      // Merge achievements with user progress
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
   * Gets user progress on all achievements
   * @static
   * @async
   * @function getUserProgress
   * @param {string} userId - User ID
   * @param {string} [status] - Filter by status (locked/unlocked/completed)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Response with user progress
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

      const userAchievements = await UserAchievement.find(query)
        .populate('achievementId')
        .sort({ updatedAt: -1 });

      if (userAchievements.length === 0) {
        return new NotFoundResponseModel('No se encontró progreso de logros');
      }

      return new SuccessResponseModel(userAchievements, userAchievements.length, 'Progreso de logros obtenido correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener progreso de logros:', error));
      return new ErrorResponseModel('Error al obtener progreso de logros');
    }
  }

  /**
   * Gets user progress on a specific achievement
   * @static
   * @async
   * @function getUserAchievementProgress
   * @param {string} userId - User ID
   * @param {string} achievementId - Achievement ID
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Response with user progress
   */
  static async getUserAchievementProgress(userId, achievementId) {
    try {
      const userAchievement = await UserAchievement.findOne({ userId, achievementId })
        .populate('achievementId');

      if (!userAchievement) {
        // If no progress exists, return default values
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
          return new NotFoundResponseModel('Logro no encontrado');
        }

        return new SuccessResponseModel({
          achievement,
          currentCount: 0,
          status: 'locked',
          unlockedAt: null,
          completedAt: null,
        }, 1, 'Progreso de logro obtenido correctamente');
      }

      return new SuccessResponseModel(userAchievement, 1, 'Progreso de logro obtenido correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener progreso de logro:', error));
      return new ErrorResponseModel('Error al obtener progreso de logro');
    }
  }

  /**
   * Increments progress on an achievement
   * @static
   * @async
   * @function incrementProgress
   * @param {string} userId - User ID
   * @param {string} achievementId - Achievement ID
   * @param {number} [amount=1] - Amount to increment
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Response with updated progress
   */
  static async incrementProgress(userId, achievementId, amount = 1) {
    try {
      const incrementDto = new IncrementProgressDto({ amount });
      const validation = incrementDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      // Verify achievement exists
      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return new NotFoundResponseModel('Logro no encontrado');
      }

      // Find or create user achievement
      let userAchievement = await UserAchievement.findOne({ userId, achievementId });

      if (!userAchievement) {
        userAchievement = new UserAchievement({
          userId,
          achievementId,
          currentCount: 0,
          status: 'locked',
        });
      }

      // Increment progress
      userAchievement.currentCount += amount;

      // Check if should unlock or complete
      if (userAchievement.currentCount >= achievement.targetCount) {
        if (userAchievement.status === 'locked') {
          userAchievement.status = 'unlocked';
          userAchievement.unlockedAt = new Date();
        }
        
        // If exactly at target or over, mark as completed
        userAchievement.status = 'completed';
        userAchievement.completedAt = new Date();
      }

      await userAchievement.save();

      // Populate achievement data
      await userAchievement.populate('achievementId');

      return new SuccessResponseModel(userAchievement, 1, 'Progreso actualizado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al incrementar progreso:', error));
      return new ErrorResponseModel('Error al incrementar progreso');
    }
  }

  /**
   * Gets user achievement statistics
   * @static
   * @async
   * @function getUserStats
   * @param {string} userId - User ID
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Response with statistics
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
   * Resets user progress on an achievement (Admin only)
   * @static
   * @async
   * @function resetProgress
   * @param {string} userId - User ID
   * @param {string} achievementId - Achievement ID
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Response with deletion confirmation
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

