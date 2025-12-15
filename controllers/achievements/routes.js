import { AchievementController } from './achievementController.js';
import { UserAchievementController } from './userAchievementController.js';
import { validateToken, validateAdminToken } from '../../middlewares/authMiddleware.js';

/**
 * Function to configure achievement routes
 * @param {Object} app - Express instance
 * @returns {void} No return value, configures achievement routes in the app
 * Configures all routes related to achievements
 */
export const setupAchievementRoutes = app => {
  // ============================================================
  // ADMIN ROUTES - Achievement Templates Management
  // ============================================================

  app.get('/api/achievements', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Achievements']
    // #swagger.summary = 'Obtiene todos los logros (solo admin)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return AchievementController.getAllAchievements(req, res);
  });

  app.get('/api/achievements/stats', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Achievements']
    // #swagger.summary = 'Obtiene estadísticas globales de logros (solo admin)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return AchievementController.getAchievementStats(req, res);
  });

  app.get('/api/achievements/type/:type', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Achievements']
    // #swagger.summary = 'Obtiene logros filtrados por tipo (solo admin)'
    /* #swagger.parameters['type'] = {
         in: 'path',
         description: 'Tipo de logro',
         required: true,
         type: 'string',
         '@enum': ['task', 'goal', 'streak', 'progress']
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return AchievementController.getAchievementsByType(req, res);
  });

  app.get('/api/achievements/:id', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Achievements']
    // #swagger.summary = 'Obtiene un logro por ID (solo admin)'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del logro',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return AchievementController.getAchievementById(req, res);
  });

  app.post('/api/achievements', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Achievements']
    // #swagger.summary = 'Crea un nuevo logro (solo admin)'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos del logro',
         required: true,
         schema: {
           name: 'Maestro de Tareas',
           description: 'Completa 100 tareas',
           type: 'task',
           target: 100,
           icon: '🏆',
           rarity: 'rare'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return AchievementController.createAchievement(req, res);
  });

  app.put('/api/achievements/:id', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Achievements']
    // #swagger.summary = 'Actualiza un logro existente (solo admin)'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del logro',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return AchievementController.updateAchievement(req, res);
  });

  app.delete('/api/achievements/:id', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Achievements']
    // #swagger.summary = 'Elimina un logro (solo admin)'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del logro',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return AchievementController.deleteAchievement(req, res);
  });

  app.delete('/api/achievements/users/:userId/achievements/:achievementId', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Achievements']
    // #swagger.summary = 'Resetea el progreso de un logro de un usuario (solo admin)'
    /* #swagger.parameters['userId'] = {
         in: 'path',
         description: 'ID del usuario',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['achievementId'] = {
         in: 'path',
         description: 'ID del logro',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UserAchievementController.resetProgress(req, res);
  });

  // ============================================================
  // USER ROUTES - Personal Progress Management
  // ============================================================

  app.get('/api/user/achievements', validateToken, (req, res) => {
    // #swagger.tags = ['User Achievements']
    // #swagger.summary = 'Obtiene todos los logros con progreso personal'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UserAchievementController.getAllAchievementsWithProgress(req, res);
  });

  app.get('/api/user/achievements/stats', validateToken, (req, res) => {
    // #swagger.tags = ['User Achievements']
    // #swagger.summary = 'Obtiene estadísticas personales de logros'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UserAchievementController.getUserStats(req, res);
  });

  app.get('/api/user/achievements/:id/progress', validateToken, (req, res) => {
    // #swagger.tags = ['User Achievements']
    // #swagger.summary = 'Obtiene el progreso en un logro específico'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del logro',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UserAchievementController.getUserAchievementProgress(req, res);
  });

  app.post('/api/user/achievements/:id/progress', validateToken, (req, res) => {
    // #swagger.tags = ['User Achievements']
    // #swagger.summary = 'Incrementa el progreso en un logro'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del logro',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Cantidad a incrementar',
         schema: {
           amount: 1
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UserAchievementController.incrementProgress(req, res);
  });
};
