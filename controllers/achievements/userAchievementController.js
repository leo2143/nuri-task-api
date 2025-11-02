import { UserAchievementService } from '../../services/userAchievementService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con el progreso de usuario en logros
 * @class UserAchievementController
 */
export class UserAchievementController {
  /**
   * Obtiene todos los logros con el progreso del usuario
   * @static
   * @async
   * @function getAllAchievementsWithProgress
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por el middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllAchievementsWithProgress(req, res) {
    const userId = req.userId;
    const result = await UserAchievementService.getAllAchievementsWithProgress(userId);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene el progreso del usuario en todos los logros con filtro opcional por estado
   * @static
   * @async
   * @function getUserProgress
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por el middleware de autenticación)
   * @param {Object} req.query - Parámetros de consulta
   * @param {string} [req.query.status] - Filtrar por estado (locked/unlocked/completed)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getUserProgress(req, res) {
    const userId = req.userId;
    const status = req.query.status;
    const result = await UserAchievementService.getUserProgress(userId, status);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene el progreso del usuario en un logro específico
   * @static
   * @async
   * @function getUserAchievementProgress
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por el middleware de autenticación)
   * @param {Object} req.params - Parámetros de URL
   * @param {string} req.params.id - ID del logro
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getUserAchievementProgress(req, res) {
    const userId = req.userId;
    const { id } = req.params;
    const result = await UserAchievementService.getUserAchievementProgress(userId, id);
    res.status(result.status).json(result);
  }

  /**
   * Incrementa el progreso en un logro
   * @static
   * @async
   * @function incrementProgress
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por el middleware de autenticación)
   * @param {Object} req.params - Parámetros de URL
   * @param {string} req.params.id - ID del logro
   * @param {Object} req.body - Cuerpo de la petición
   * @param {number} [req.body.amount=1] - Cantidad a incrementar
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async incrementProgress(req, res) {
    const userId = req.userId;
    const { id } = req.params;
    const amount = req.body.amount || 1;
    const result = await UserAchievementService.incrementProgress(userId, id, amount);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene estadísticas de logros del usuario
   * @static
   * @async
   * @function getUserStats
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por el middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getUserStats(req, res) {
    const userId = req.userId;
    const result = await UserAchievementService.getUserStats(userId);
    res.status(result.status).json(result);
  }

  /**
   * Reinicia el progreso del usuario en un logro (solo administradores)
   * @static
   * @async
   * @function resetProgress
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.params - Parámetros de URL
   * @param {string} req.params.userId - ID del usuario
   * @param {string} req.params.achievementId - ID del logro
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async resetProgress(req, res) {
    const { userId, achievementId } = req.params;
    const result = await UserAchievementService.resetProgress(userId, achievementId);
    res.status(result.status).json(result);
  }
}
