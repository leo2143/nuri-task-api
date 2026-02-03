import { AchievementService } from '../../services/achievementService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con plantillas de logros (solo administradores)
 */
export class AchievementController {
  /**
   * Obtiene todas las plantillas de logros con filtros opcionales
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.query - Parámetros de consulta (type, isActive, search, sortBy, sortOrder, cursor, limit)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllAchievements(req, res) {
    // Pasar todos los query params como filtros (incluye paginación)
    const filters = { ...req.query };

    // Convertir isActive a booleano si existe
    if (filters.isActive !== undefined) {
      filters.isActive = filters.isActive === 'true';
    }

    const result = await AchievementService.getAllAchievements(filters);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene una plantilla de logro por ID
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.params - Parámetros de URL
   * @param {string} req.params.id - ID del logro
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAchievementById(req, res) {
    const { id } = req.params;
    const result = await AchievementService.getAchievementById(id);
    res.status(result.status).json(result);
  }

  /**
   * Crea una nueva plantilla de logro (solo administradores)
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.body - Datos del logro
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async createAchievement(req, res) {
    const achievementData = req.body;
    const result = await AchievementService.createAchievement(achievementData);
    res.status(result.status).json(result);
  }

  /**
   * Actualiza una plantilla de logro existente (solo administradores)
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.params - Parámetros de URL
   * @param {string} req.params.id - ID del logro
   * @param {Object} req.body - Datos a actualizar
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updateAchievement(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    const result = await AchievementService.updateAchievement(id, updateData);
    res.status(result.status).json(result);
  }

  /**
   * Elimina una plantilla de logro (solo administradores)
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.params - Parámetros de URL
   * @param {string} req.params.id - ID del logro
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async deleteAchievement(req, res) {
    const { id } = req.params;
    const result = await AchievementService.deleteAchievement(id);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene logros por tipo
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.params - Parámetros de URL
   * @param {string} req.params.type - Tipo de logro
   * @param {Object} req.query - Query params para paginación
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAchievementsByType(req, res) {
    const { type } = req.params;
    const result = await AchievementService.getAchievementsByType(type, req.query);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene estadísticas de plantillas de logros
   * @param {Object} req - Objeto request de Express
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAchievementStats(req, res) {
    const result = await AchievementService.getAchievementStats();
    res.status(result.status).json(result);
  }
}
