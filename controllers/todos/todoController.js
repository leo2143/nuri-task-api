import { TodoService } from "../../services/todoService.js";

/**
 * Controlador para manejar las peticiones HTTP relacionadas con tareas (todos)
 * @class TodoController
 */
export class TodoController {
  /**
   * Obtiene todas las tareas del usuario autenticado
   * @static
   * @async
   * @function getAllTodos
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllTodos(req, res) {
    const userId = req.userId;
    const result = await TodoService.getAllTodos(userId);
    res.json(result);
  }

  static async getTodoById(req, res) {
    const id = req.params.id;
    const userId = req.userId;
    const result = await TodoService.getTodoById(id, userId);
    res.json(result);
  }

  /**
   * Crea una nueva tarea para el usuario autenticado
   * @static
   * @async
   * @function createTodo
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
    res.json(result);
  }

  static async updateTodo(req, res) {
    const id = req.params.id;
    const todoData = req.body;
    const userId = req.userId;
    const result = await TodoService.updateTodo(id, todoData, userId);
    res.json(result);
  }

  static async deleteTodo(req, res) {
    const id = req.params.id;
    const userId = req.userId;
    const result = await TodoService.deleteTodo(id, userId);
    res.json(result);
  }

  /**
   * Obtiene todas las tareas completadas del usuario autenticado
   * @static
   * @async
   * @function getCompletedTodos
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getCompletedTodos(req, res) {
    const userId = req.userId;
    const result = await TodoService.getTodosByStatus(true, userId);
    res.json(result);
  }

  /**
   * Obtiene todas las tareas pendientes del usuario autenticado
   * @static
   * @async
   * @function getPendingTodos
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getPendingTodos(req, res) {
    const userId = req.userId;
    const result = await TodoService.getTodosByStatus(false, userId);
    res.json(result);
  }
}
