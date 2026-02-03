import { TodoService } from '../../services/todoService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con tareas (todos)
 */
export class TodoController {
  /**
   * Obtiene todas las tareas con filtros opcionales y paginación
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.query - Query parameters para filtros
   * @param {string} [req.query.search] - Término de búsqueda en título
   * @param {boolean} [req.query.completed] - Filtrar por estado completado
   * @param {string} [req.query.priority] - Filtrar por prioridad
   * @param {string} [req.query.cursor] - Cursor para paginación
   * @param {number} [req.query.limit] - Límite de resultados por página
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllTodos(req, res) {
    try {
      const userId = req.userId;
      // Pasar todos los query params como filtros (incluye paginación)
      const filters = req.query;

      const result = await TodoService.getAllTodos(filters, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getAllTodos:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  static async getTodoById(req, res) {
    const id = req.params.id;
    const userId = req.userId;
    const result = await TodoService.getTodoById(id, userId);
    res.status(result.status).json(result);
  }

  /**
   * Crea una nueva tarea para el usuario autenticado
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.body - Datos de la tarea a crear
   * @param {string} req.body.title - Título de la tarea (requerido)
   * @param {string} [req.body.description] - Descripción de la tarea
   * @param {string} [req.body.priority='medium'] - Prioridad (low/medium/high)
   * @param {Date} [req.body.dueDate] - Fecha límite de la tarea
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async createTodo(req, res) {
    const todoData = req.body;
    const userId = req.userId;
    const result = await TodoService.createTodo(todoData, userId);
    res.status(result.status).json(result);
  }

  static async updateTodo(req, res) {
    const id = req.params.id;
    const todoData = req.body;
    const userId = req.userId;
    const result = await TodoService.updateTodo(id, todoData, userId);
    res.status(result.status).json(result);
  }

  /**
   * Actualiza solo el estado (completed) de una tarea
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la tarea
   * @param {Object} req.body - Datos del estado
   * @param {boolean} req.body.completed - Nuevo estado de completado (true/false)
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updateTodoState(req, res) {
    const id = req.params.id;
    const { completed } = req.body;
    const userId = req.userId;
    const result = await TodoService.updateTodoState(id, completed, userId);
    res.status(result.status).json(result);
  }

  static async getByTitle(req, res) {
    const title = req.params.title;
    const userId = req.userId;
    const result = await TodoService.getTodoByTitle(title, userId);
    res.status(result.status).json(result);
  }

  static async deleteTodo(req, res) {
    const id = req.params.id;
    const userId = req.userId;
    const result = await TodoService.deleteTodo(id, userId);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene todas las tareas completadas del usuario autenticado
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.query - Query params para paginación
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getCompletedTodos(req, res) {
    const userId = req.userId;
    const result = await TodoService.getTodosByStatus(true, userId, req.query);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene todas las tareas pendientes del usuario autenticado
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.query - Query params para paginación
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getPendingTodos(req, res) {
    const userId = req.userId;
    const result = await TodoService.getTodosByStatus(false, userId, req.query);
    res.status(result.status).json(result);
  }

  /**
   * Obtiene todas las tareas de una meta específica
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.goalId - ID de la meta
   * @param {Object} req.query - Query params para paginación
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getTodosByGoalId(req, res) {
    const goalId = req.params.goalId;
    const userId = req.userId;
    const result = await TodoService.getTodosByGoalId(goalId, userId, req.query);
    res.status(result.status).json(result);
  }

  /**
   * Agrega un comentario a una tarea
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID de la tarea
   * @param {Object} req.body - Datos del comentario
   * @param {string} req.body.text - Texto del comentario (requerido)
   * @param {string} req.body.author - Autor del comentario (requerido)
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async addCommentToTodo(req, res) {
    try {
      const todoId = req.params.id;
      const commentData = req.body;
      const userId = req.userId;

      const result = await TodoService.addCommentToTodo(todoId, commentData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en addCommentToTodo:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}
