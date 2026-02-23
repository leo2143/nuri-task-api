import { GoalService } from '../../services/goalService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con metas (goals)
 */
export class GoalController {
  /**
   * Obtiene todas las metas del usuario autenticado con filtros opcionales
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.query - Query parameters (status, priority, search, dueDateFrom, dueDateTo, sortBy, sortOrder, cursor, limit)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllGoals(req, res) {
    const userId = req.userId;
    // Pasar todos los query params como filtros (incluye paginación)
    const filters = req.query;
    const result = await GoalService.getAllGoals(userId, filters);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene una meta específica por ID
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
    res.status(result.status).json(result);
  }

  /**
   * Crea una nueva meta
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
    res.status(result.status).json(result);
  }

  /**
   * Actualiza una meta existente
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
    res.status(result.status).json(result);
  }

  /**
   * Elimina una meta
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
    res.status(result.status).json(result);
  }

  /**
   * Obtiene metas activas
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.query - Query params para paginación
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getActiveGoals(req, res) {
    const userId = req.userId;
    const result = await GoalService.getGoalsByStatus('active', userId, req.query);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene metas pausadas
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.query - Query params para paginación
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getPausedGoals(req, res) {
    const userId = req.userId;
    const result = await GoalService.getGoalsByStatus('paused', userId, req.query);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene metas completadas
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.query - Query params para paginación
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getCompletedGoals(req, res) {
    const userId = req.userId;
    const result = await GoalService.getGoalsByStatus('completed', userId, req.query);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene metas por ID de la meta padre
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID de la meta padre
   * @param {Object} req.query - Query params para paginación
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getGoalsByParentGoalId(req, res) {
    const { id } = req.params;
    const userId = req.userId;
    const result = await GoalService.getGoalsByParentGoalId(id, userId, req.query);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene lista catalog de metas (solo id y título)
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   * Útilizado para selects
   */
  static async getCatalogGoals(req, res) {
    const userId = req.userId;
    const result = await GoalService.getCatalogGoals(userId);
    res.status(result.status).json(result);
  }

  /**
   * Agrega una submeta a una meta padre
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la meta padre (la meta que estás viendo)
   * @param {Object} req.body - Datos
   * @param {string} req.body.subgoalId - ID de la meta que será submeta
   * @param {string} req.userId - ID del usuario
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>}
   */
  static async addSubgoal(req, res) {
    const parentGoalId = req.params.id;
    const { subgoalId } = req.body;
    const userId = req.userId;
    const result = await GoalService.addSubgoal(parentGoalId, subgoalId, userId);
    res.status(result.status).json(result);
  }

  /**
   * Actualiza solo el estado de una meta
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la meta
   * @param {Object} req.body - Datos
   * @param {string} req.body.status - Nuevo estado (active/paused/completed)
   * @param {string} req.userId - ID del usuario
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>}
   */
  static async updateGoalStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;
    const result = await GoalService.updateGoalStatus(id, status, userId);
    res.status(result.status).json(result);
  }
}
