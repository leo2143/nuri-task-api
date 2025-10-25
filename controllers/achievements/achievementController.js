import { AchievementService } from '../../services/achievementService.js';

/**
 * Controller to handle HTTP requests related to achievement templates (Admin only)
 * @class AchievementController
 */
export class AchievementController {
  /**
   * Gets all achievement templates with optional filters
   * @static
   * @async
   * @function getAllAchievements
   * @param {Object} req - Express request object
   * @param {Object} req.query - Query parameters (type, isActive, search, sortBy, sortOrder)
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   * @example
   * GET /api/admin/achievements?type=task&search=completar&sortBy=targetCount&sortOrder=asc
   */
  static async getAllAchievements(req, res) {
    const filters = {
      type: req.query.type,
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };
    
    // Only add isActive filter if explicitly provided
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    
    const result = await AchievementService.getAllAchievements(filters);
    res.json(result);
  }

  /**
   * Gets a specific achievement template by ID
   * @static
   * @async
   * @function getAchievementById
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Achievement ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   */
  static async getAchievementById(req, res) {
    const { id } = req.params;
    const result = await AchievementService.getAchievementById(id);
    res.json(result);
  }

  /**
   * Creates a new achievement template (Admin only)
   * @static
   * @async
   * @function createAchievement
   * @param {Object} req - Express request object
   * @param {Object} req.body - Achievement data
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   */
  static async createAchievement(req, res) {
    const achievementData = req.body;
    const result = await AchievementService.createAchievement(achievementData);
    res.json(result);
  }

  /**
   * Updates an existing achievement template (Admin only)
   * @static
   * @async
   * @function updateAchievement
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Achievement ID
   * @param {Object} req.body - Data to update
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   */
  static async updateAchievement(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    const result = await AchievementService.updateAchievement(id, updateData);
    res.json(result);
  }

  /**
   * Deletes an achievement template (Admin only)
   * @static
   * @async
   * @function deleteAchievement
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Achievement ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   */
  static async deleteAchievement(req, res) {
    const { id } = req.params;
    const result = await AchievementService.deleteAchievement(id);
    res.json(result);
  }

  /**
   * Gets achievements by type
   * @static
   * @async
   * @function getAchievementsByType
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.type - Achievement type
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   */
  static async getAchievementsByType(req, res) {
    const { type } = req.params;
    const result = await AchievementService.getAchievementsByType(type);
    res.json(result);
  }

  /**
   * Gets achievement template statistics
   * @static
   * @async
   * @function getAchievementStats
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   */
  static async getAchievementStats(req, res) {
    const result = await AchievementService.getAchievementStats();
    res.json(result);
  }
}

