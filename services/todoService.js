import Todo from '../models/todoModel.js';
import { NotFoundResponseModel, ErrorResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de tareas (todos)
 * @class TodoService
 */
export class TodoService {
  /**
   * Obtiene todas las tareas con filtros opcionales
   * @static
   * @async
   * @function getAllTodos
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} [filters.search] - Término de búsqueda en título
   * @param {boolean} [filters.completed] - Filtrar por estado completado
   * @param {string} [filters.priority] - Filtrar por prioridad
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista de tareas o error
   * @example
   */
  static async getAllTodos(filters = {}) {
    try {
      // Construir query de búsqueda
      const query = {};

      // Búsqueda por título (case insensitive)
      if (filters.search) {
        query.title = { $regex: filters.search, $options: 'i' };
      }

      // Filtro por estado completado
      if (filters.completed !== undefined) {
        query.completed = filters.completed === 'true';
      }

      // Filtro por prioridad
      if (filters.priority) {
        query.priority = filters.priority;
      }

      const todos = await Todo.find(query).sort({ createdAt: -1 });
      if (todos.length === 0) {
        return new NotFoundResponseModel('No se encontraron tareas con los filtros aplicados');
      }
      return new SuccessResponseModel(todos, todos.length, 'Tareas obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener tareas:', error));
      return new ErrorResponseModel('Error al obtener tareas');
    }
  }

  static async getTodoById(id, userId) {
    try {
      const todo = await Todo.findOne({ _id: id });
      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }
      return new SuccessResponseModel(todo, 1, 'Tarea obtenida correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener tarea:', error));
      return new ErrorResponseModel('Error al obtener tarea');
    }
  }
  /**
   * Busca tareas por título (búsqueda exacta)
   * @static
   * @async
   * @function getTodoByTitle
   * @param {string} title - Título exacto a buscar
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea encontrada o error
   * @example
   */
  static async getTodoByTitle(title) {
    try {
      const todo = await Todo.findOne({ title });
      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el título: ' + title);
      }
      return new SuccessResponseModel(todo, 1, 'Tarea obtenida correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener tarea:', error));
      return new ErrorResponseModel('Error al obtener tarea');
    }
  }

  /**
   * Crea una nueva tarea para un usuario específico
   * @static
   * @async
   * @function createTodo
   * @param {Object} todoData - Datos de la tarea a crear
   * @param {string} todoData.title - Título de la tarea (requerido)
   * @param {string} [todoData.description=''] - Descripción de la tarea
   * @param {string} [todoData.priority='medium'] - Prioridad (low/medium/high)
   * @param {Date} [todoData.dueDate=null] - Fecha límite de la tarea
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la tarea creada o error
   * @example
   */
  static async createTodo(todoData, userId) {
    try {
      const { title, description, priority, dueDate } = todoData;

      if (!title) {
        return new ErrorResponseModel('El título es requerido');
      }

      const todo = new Todo({
        title,
        description: description || '',
        priority: priority || 'medium',
        dueDate: dueDate || null,
        userId,
      });

      const savedTodo = await todo.save();
      return new CreatedResponseModel(savedTodo, 'Tarea creada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al crear tarea:', error));
      return new ErrorResponseModel('Error al crear tarea');
    }
  }

  static async updateTodo(id, todoData, userId) {
    try {
      const { title, description, completed, priority, dueDate } = todoData;

      const todo = await Todo.findOneAndUpdate(
        { _id: id },
        {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(completed !== undefined && { completed }),
          ...(priority && { priority }),
          ...(dueDate !== undefined && { dueDate }),
        },
        { new: true }
      );

      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }

      return new SuccessResponseModel(todo, 1, 'Tarea actualizada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar tarea:', error));
      return new ErrorResponseModel('Error al actualizar tarea');
    }
  }

  static async deleteTodo(id, userId) {
    try {
      const todo = await Todo.findOneAndDelete({ _id: id });
      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }
      return new SuccessResponseModel(todo, 1, 'Tarea eliminada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar tarea:', error));
      return new ErrorResponseModel('Error al eliminar tarea');
    }
  }

  static async getTodosByStatus(completed, userId) {
    try {
      const todos = await Todo.find({ completed }).sort({ createdAt: -1 });
      if (todos.length === 0) {
        return new NotFoundResponseModel(`No se encontraron tareas ${completed ? 'completadas' : 'pendientes'}`);
      }
      return new SuccessResponseModel(
        todos,
        todos.length,
        `Tareas ${completed ? 'completadas' : 'pendientes'} obtenidas correctamente`
      );
    } catch (error) {
      console.error(chalk.red('Error al obtener tareas por estado:', error));
      return new ErrorResponseModel('Error al obtener tareas por estado');
    }
  }

  static async getTodosByPriority(priority, userId) {
    try {
      const todos = await Todo.find({ priority }).sort({ createdAt: -1 });
      if (todos.length === 0) {
        return new NotFoundResponseModel(`No se encontraron tareas ${priority ? 'alta' : 'media' || 'baja'}`);
      }
      return new SuccessResponseModel(
        todos,
        todos.length,
        `Tareas ${priority ? 'alta' : 'media' || 'baja'} obtenidas correctamente`
      );
    } catch (error) {
      console.error(chalk.red('Error al obtener tareas por prioridad:', error));
      return new ErrorResponseModel('Error al obtener tareas por prioridad');
    }
  }
}
