import Achievement from '../models/achievementModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import { CreateAchievementDto, UpdateAchievementDto, AchievementFilterDto } from '../models/dtos/achievements/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import chalk from 'chalk';

const VALID_ACHIEVEMENT_TYPES = ['task', 'goal', 'metric', 'streak'];

/**
 * Servicio para gestionar plantillas globales de logros (solo administradores)
 */
export class AchievementService {
  /**
   * Obtiene todas las plantillas de logros con filtros opcionales
   * @param {Object} [filters={}] - Filtros de búsqueda (type, isActive, search, sortBy, sortOrder)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista de plantillas o error
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

      const achievements = await Achievement.find(query)
        .sort(sort)
        .limit(filterDto.limit + 1)
        .lean();

      const { results, meta } = filterDto.processPaginationResults(achievements);

      if (results.length === 0) {
        return new NotFoundResponseModel('No se encontraron plantillas de logros');
      }

      return new SuccessResponseModel(results, 'Plantillas de logros obtenidas correctamente', 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener plantillas de logros');
    }
  }

  /**
   * Obtiene una plantilla de logro por ID
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la plantilla o error
   */
  static async getAchievementById(achievementId) {
    try {
      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return new NotFoundResponseModel('Plantilla de logro no encontrada');
      }
      return new SuccessResponseModel(achievement, 'Plantilla de logro obtenida correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener plantilla de logro');
    }
  }

  /**
   * Crea una nueva plantilla de logro (solo administradores)
   * @param {Object} achievementData - Datos del logro
   * @param {string} achievementData.title - Título del logro
   * @param {string} achievementData.description - Descripción del logro
   * @param {number} achievementData.targetCount - Cantidad objetivo
   * @param {string} achievementData.type - Tipo de logro
   * @param {string} achievementData.reward - Recompensa del logro
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la plantilla creada o error
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
      return ErrorHandler.handleDatabaseError(error, 'crear plantilla de logro');
    }
  }

  /**
   * Actualiza una plantilla de logro existente (solo administradores)
   * @param {string} achievementId - ID del logro
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la plantilla actualizada o error
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

      return new SuccessResponseModel(achievement, 'Plantilla de logro actualizada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar plantilla de logro');
    }
  }

  /**
   * Elimina una plantilla de logro (solo administradores)
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación de eliminación o error
   */
  static async deleteAchievement(achievementId) {
    try {
      const achievement = await Achievement.findByIdAndDelete(achievementId);

      if (!achievement) {
        return new NotFoundResponseModel('Plantilla de logro no encontrada');
      }

      return new SuccessResponseModel(achievement, 'Plantilla de logro eliminada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar plantilla de logro');
    }
  }

  /**
   * Obtiene plantillas de logros por tipo
   * @param {string} type - Tipo de logro (task/goal/metric/streak)
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las plantillas filtradas o error
   */
  static async getAchievementsByType(type, pagination = {}) {
    try {
      if (!VALID_ACHIEVEMENT_TYPES.includes(type)) {
        return new BadRequestResponseModel(`El tipo debe ser uno de: ${VALID_ACHIEVEMENT_TYPES.join(', ')}`);
      }

      const paginationDto = new AchievementFilterDto(pagination);
      const query = { type, isActive: true };
      paginationDto.applyCursorToQuery(query);

      const achievements = await Achievement.find(query)
        .sort({ createdAt: -1 })
        .limit(paginationDto.limit + 1)
        .lean();

      const { results, meta } = paginationDto.processPaginationResults(achievements);

      if (results.length === 0) {
        return new NotFoundResponseModel(`No se encontraron plantillas de logros de tipo ${type}`);
      }

      return new SuccessResponseModel(
        results,
        `Plantillas de logros de tipo ${type} obtenidas correctamente`,
        200,
        meta
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener plantillas de logros por tipo');
    }
  }

  /**
   * Obtiene estadísticas de plantillas de logros
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con estadísticas o error
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
            count: { $sum: 1 },
          },
        },
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

      return new SuccessResponseModel(stats, 'Estadísticas de plantillas de logros obtenidas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener estadísticas de plantillas de logros');
    }
  }
}
