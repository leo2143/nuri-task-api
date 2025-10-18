import { GoalService } from '../../services/goalService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con metas (goals)
 * @class GoalController
 */
export class GoalController {
  /**
   * Obtiene todas las metas del usuario autenticado
   * @static
   * @async
   * @function getAllGoals
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllGoals(req, res) {
    const userId = req.userId;
    const result = await GoalService.getAllGoals(userId);
    res.json(result);
  }

  /**
   * Obtiene una meta específica por ID
   * @static
   * @async
   * @function getGoalById
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID de la meta
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getGoalById(req, res) {
    const { id } = req.params;
    const userId = req.userId;
    const result = await GoalService.getGoalById(id, userId);
    res.json(result);
  }

  /**
   * Crea una nueva meta
   * @static
   * @async
   * @function createGoal
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.body - Datos de la meta
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async createGoal(req, res) {
    const goalData = req.body;
    const userId = req.userId;
    const result = await GoalService.createGoal(goalData, userId);
    res.json(result);
  }

  /**
   * Actualiza una meta existente
   * @static
   * @async
   * @function updateGoal
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID de la meta
   * @param {Object} req.body - Datos a actualizar
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updateGoal(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.userId;
    const result = await GoalService.updateGoal(id, updateData, userId);
    res.json(result);
  }

  /**
   * Elimina una meta
   * @static
   * @async
   * @function deleteGoal
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID de la meta
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async deleteGoal(req, res) {
    const { id } = req.params;
    const userId = req.userId;
    const result = await GoalService.deleteGoal(id, userId);
    res.json(result);
  }

  /**
   * Obtiene metas activas
   * @static
   * @async
   * @function getActiveGoals
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getActiveGoals(req, res) {
    const userId = req.userId;
    const result = await GoalService.getGoalsByStatus('active', userId);
    res.json(result);
  }

  /**
   * Obtiene metas pausadas
   * @static
   * @async
   * @function getPausedGoals
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getPausedGoals(req, res) {
    const userId = req.userId;
    const result = await GoalService.getGoalsByStatus('paused', userId);
    res.json(result);
  }

  /**
   * Obtiene metas completadas
   * @static
   * @async
   * @function getCompletedGoals
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getCompletedGoals(req, res) {
    const userId = req.userId;
    const result = await GoalService.getGoalsByStatus('completed', userId);
    res.json(result);
  }

  /**
   * Agrega un comentario a la meta
   * @static
   * @async
   * @function addComment
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID de la meta
   * @param {Object} req.body - Datos del comentario
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async addComment(req, res) {
    const { id } = req.params;
    const commentData = req.body;
    const userId = req.userId;
    const result = await GoalService.addComment(id, commentData, userId);
    res.json(result);
  }
}
