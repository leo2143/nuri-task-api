import { UserAchievementService } from '../../services/userAchievementService.js';

/**
 * Controller to handle HTTP requests related to user progress on achievements
 * @class UserAchievementController
 */
export class UserAchievementController {
  /**
   * Gets all achievements with user progress
   * @static
   * @async
   * @function getAllAchievementsWithProgress
   * @param {Object} req - Express request object
   * @param {string} req.userId - User ID (added by authentication middleware)
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   * @example
   * GET /api/user/achievements
   */
  static async getAllAchievementsWithProgress(req, res) {
    const userId = req.userId;
    const result = await UserAchievementService.getAllAchievementsWithProgress(userId);
    res.json(result);
  }

  /**
   * Gets user progress on all achievements with optional status filter
   * @static
   * @async
   * @function getUserProgress
   * @param {Object} req - Express request object
   * @param {string} req.userId - User ID (added by authentication middleware)
   * @param {Object} req.query - Query parameters
   * @param {string} [req.query.status] - Filter by status (locked/unlocked/completed)
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   * @example
   * GET /api/user/achievements/progress?status=completed
   */
  static async getUserProgress(req, res) {
    const userId = req.userId;
    const status = req.query.status;
    const result = await UserAchievementService.getUserProgress(userId, status);
    res.json(result);
  }

  /**
   * Gets user progress on a specific achievement
   * @static
   * @async
   * @function getUserAchievementProgress
   * @param {Object} req - Express request object
   * @param {string} req.userId - User ID (added by authentication middleware)
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Achievement ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   * @example
   * GET /api/user/achievements/:id/progress
   */
  static async getUserAchievementProgress(req, res) {
    const userId = req.userId;
    const { id } = req.params;
    const result = await UserAchievementService.getUserAchievementProgress(userId, id);
    res.json(result);
  }

  /**
   * Increments progress on an achievement
   * @static
   * @async
   * @function incrementProgress
   * @param {Object} req - Express request object
   * @param {string} req.userId - User ID (added by authentication middleware)
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.id - Achievement ID
   * @param {Object} req.body - Request body
   * @param {number} [req.body.amount=1] - Amount to increment
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   * @example
   * POST /api/user/achievements/:id/progress
   * Body: { "amount": 1 }
   */
  static async incrementProgress(req, res) {
    const userId = req.userId;
    const { id } = req.params;
    const amount = req.body.amount || 1;
    const result = await UserAchievementService.incrementProgress(userId, id, amount);
    res.json(result);
  }

  /**
   * Gets user achievement statistics
   * @static
   * @async
   * @function getUserStats
   * @param {Object} req - Express request object
   * @param {string} req.userId - User ID (added by authentication middleware)
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   * @example
   * GET /api/user/achievements/stats
   */
  static async getUserStats(req, res) {
    const userId = req.userId;
    const result = await UserAchievementService.getUserStats(userId);
    res.json(result);
  }

  /**
   * Resets user progress on an achievement (Admin only)
   * @static
   * @async
   * @function resetProgress
   * @param {Object} req - Express request object
   * @param {Object} req.params - URL parameters
   * @param {string} req.params.userId - User ID
   * @param {string} req.params.achievementId - Achievement ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} No return value, sends HTTP response
   * @example
   * DELETE /api/admin/users/:userId/achievements/:achievementId
   */
  static async resetProgress(req, res) {
    const { userId, achievementId } = req.params;
    const result = await UserAchievementService.resetProgress(userId, achievementId);
    res.json(result);
  }
}

