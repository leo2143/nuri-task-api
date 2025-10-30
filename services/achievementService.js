import Achievement from '../models/achievementModel.js';
import {
  NotFoundResponseModel,
  ErrorResponseModel,
  BadRequestResponseModel,
} from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import {
  CreateAchievementDto,
  UpdateAchievementDto,
  AchievementFilterDto,
} from '../models/dtos/achievements/index.js';
import chalk from 'chalk';

/**
 * Service to handle global achievement templates (Admin only)
 * @class AchievementService
 */
export class AchievementService {
  /**
   * Gets all achievement templates with optional filters
   * @static
   * @async
   * @function getAllAchievements
   * @param {Object} [filters={}] - Search filters (type, isActive, search, sortBy, sortOrder)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Response with achievement list or error
   */
  static async getAllAchievements(filters = {}) {
    try {
      const filterDto = new AchievementFilterDto(filters);
      const validation = filterDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const query = filterDto.toMongoQuery();
      const sort = filterDto.toMongoSort();

      const achievements = await Achievement.find(query).sort(sort);
      if (achievements.length === 0) {
        return new NotFoundResponseModel('No se encontraron plantillas de logros');
      }
      return new SuccessResponseModel(achievements, achievements.length, 'Plantillas de logros obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener plantillas de logros:', error));
      return new ErrorResponseModel('Error al obtener plantillas de logros');
    }
  }

  /**
   * Gets a specific achievement template by ID
   * @static
   * @async
   * @function getAchievementById
   * @param {string} achievementId - Achievement ID
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Response with achievement or error
   */
  static async getAchievementById(achievementId) {
    try {
      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return new NotFoundResponseModel('Plantilla de logro no encontrada');
      }
      return new SuccessResponseModel(achievement, 1, 'Plantilla de logro obtenida correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener plantilla de logro:', error));
      return new ErrorResponseModel('Error al obtener plantilla de logro');
    }
  }

  /**
   * Creates a new achievement template (Admin only)
   * @static
   * @async
   * @function createAchievement
   * @param {Object} achievementData - Achievement data
   * @param {string} achievementData.title - Achievement title
   * @param {string} achievementData.description - Achievement description
   * @param {number} achievementData.targetCount - Target count
   * @param {string} achievementData.type - Achievement type
   * @param {string} achievementData.reward - Achievement reward
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Response with created achievement or error
   */
  static async createAchievement(achievementData) {
    try {
      const createDto = new CreateAchievementDto(achievementData);
      const validation = createDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = createDto.toPlainObject();
      const achievement = new Achievement(cleanData);
      const savedAchievement = await achievement.save();
      return new CreatedResponseModel(savedAchievement, 'Plantilla de logro creada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al crear plantilla de logro:', error));
      return new ErrorResponseModel('Error al crear plantilla de logro');
    }
  }

  /**
   * Updates an existing achievement template (Admin only)
   * @static
   * @async
   * @function updateAchievement
   * @param {string} achievementId - Achievement ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Response with updated achievement or error
   */
  static async updateAchievement(achievementId, updateData) {
    try {
      const updateDto = new UpdateAchievementDto(updateData);
      const validation = updateDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = updateDto.toPlainObject();
      const achievement = await Achievement.findByIdAndUpdate(
        achievementId,
        { $set: cleanData },
        { new: true, runValidators: true }
      );

      if (!achievement) {
        return new NotFoundResponseModel('Plantilla de logro no encontrada');
      }

      return new SuccessResponseModel(achievement, 1, 'Plantilla de logro actualizada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar plantilla de logro:', error));
      return new ErrorResponseModel('Error al actualizar plantilla de logro');
    }
  }

  /**
   * Deletes an achievement template (Admin only)
   * @static
   * @async
   * @function deleteAchievement
   * @param {string} achievementId - Achievement ID
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Response with deletion confirmation or error
   */
  static async deleteAchievement(achievementId) {
    try {
      const achievement = await Achievement.findByIdAndDelete(achievementId);

      if (!achievement) {
        return new NotFoundResponseModel('Plantilla de logro no encontrada');
      }

      return new SuccessResponseModel(achievement, 1, 'Plantilla de logro eliminada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar plantilla de logro:', error));
      return new ErrorResponseModel('Error al eliminar plantilla de logro');
    }
  }

  /**
   * Gets achievement templates by type
   * @static
   * @async
   * @function getAchievementsByType
   * @param {string} type - Achievement type (task/goal/metric/streak/comment)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Response with filtered achievements or error
   */
  static async getAchievementsByType(type) {
    try {
      const validTypes = ['task', 'goal', 'metric', 'streak', 'comment'];
      if (!validTypes.includes(type)) {
        return new ErrorResponseModel(`El tipo debe ser uno de: ${validTypes.join(', ')}`);
      }

      const achievements = await Achievement.find({ type, isActive: true });

      if (achievements.length === 0) {
        return new NotFoundResponseModel(`No se encontraron plantillas de logros de tipo ${type}`);
      }

      return new SuccessResponseModel(achievements, achievements.length, `Plantillas de logros de tipo ${type} obtenidas correctamente`);
    } catch (error) {
      console.error(chalk.red('Error al obtener plantillas de logros por tipo:', error));
      return new ErrorResponseModel('Error al obtener plantillas de logros por tipo');
    }
  }

  /**
   * Gets achievement statistics
   * @static
   * @async
   * @function getAchievementStats
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Response with statistics or error
   */
  static async getAchievementStats() {
    try {
      const total = await Achievement.countDocuments();
      const active = await Achievement.countDocuments({ isActive: true });
      const inactive = await Achievement.countDocuments({ isActive: false });
      
      const byType = await Achievement.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = {
        total,
        active,
        inactive,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };

      return new SuccessResponseModel(stats, 1, 'Estadísticas de plantillas de logros obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener estadísticas de plantillas de logros:', error));
      return new ErrorResponseModel('Error al obtener estadísticas de plantillas de logros');
    }
  }
}
