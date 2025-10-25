import { AchievementController } from './achievementController.js';
import { UserAchievementController } from './userAchievementController.js';
import { validarToken, validarAdminToken } from '../../middlewares/authMiddleware.js';

/**
 * Function to configure achievement routes
 * @function setupAchievementRoutes
 * @param {Object} app - Express instance
 * @returns {void} No return value, configures achievement routes in the app
 * @description Configures all routes related to achievements
 * - Admin routes (/api/admin/achievements): Manage global achievement templates
 * - User routes (/api/user/achievements): View and track personal progress
 */
export const setupAchievementRoutes = app => {
  // ============================================================
  // ADMIN ROUTES - Achievement Templates Management (Admin only)
  // ============================================================
  app.get('/api/achievements', validarAdminToken, AchievementController.getAllAchievements);
  app.get('/api/achievements/stats', validarAdminToken, AchievementController.getAchievementStats);
  app.get('/api/achievements/type/:type', validarAdminToken, AchievementController.getAchievementsByType);
  app.get('/api/achievements/:id', validarAdminToken, AchievementController.getAchievementById);
  app.post('/api/achievements', validarAdminToken, AchievementController.createAchievement);
  app.put('/api/achievements/:id', validarAdminToken, AchievementController.updateAchievement);
  app.delete('/api/achievements/:id', validarAdminToken, AchievementController.deleteAchievement);

  // Admin: Reset user progress
  app.delete('/api/admin/users/:userId/achievements/:achievementId', validarAdminToken, UserAchievementController.resetProgress);

  // ============================================================
  // USER ROUTES - Personal Progress Management
  // ============================================================
  // Get all achievements with personal progress
  app.get('/api/user/achievements', validarToken, UserAchievementController.getAllAchievementsWithProgress);
  
  // Get personal progress (filtered by status if needed)
  app.get('/api/user/achievements/progress', validarToken, UserAchievementController.getUserProgress);
  
  // Get personal statistics
  app.get('/api/user/achievements/stats', validarToken, UserAchievementController.getUserStats);
  
  // Get progress on specific achievement
  app.get('/api/user/achievements/:id/progress', validarToken, UserAchievementController.getUserAchievementProgress);
  
  // Increment progress on an achievement
  app.post('/api/user/achievements/:id/progress', validarToken, UserAchievementController.incrementProgress);
};
