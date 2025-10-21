import Todo from '../models/todoModel.js';
import { NotFoundResponseModel, ErrorResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import { CreateTodoDto, UpdateTodoDto, TodoFilterDto, AddCommentDto } from '../models/dtos/todo/index.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de tareas (todos)
 * @class TodoService
 */
export class TodoService {
  /**
   * Obtiene todas las tareas con filtros opcionales del usuario autenticado
   * @static
   * @async
   * @function getAllTodos
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} [filters.search] - Término de búsqueda en título
   * @param {boolean} [filters.completed] - Filtrar por estado completado
   * @param {string} [filters.priority] - Filtrar por prioridad
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista de tareas o error
   * @example
   */
  static async getAllTodos(filters = {}, userId) {
    try {
      const filterDto = new TodoFilterDto(filters);
      const validation = filterDto.validate();

      if (!validation.isValid) {
        return new ErrorResponseModel(validation.errors.join(', '));
      }

      const query = { userId, ...filterDto.toMongoQuery() };
      const sort = filterDto.toMongoSort();

      const todos = await Todo.find(query).sort(sort);
      if (todos.length === 0) {
        return new NotFoundResponseModel('No se encontraron tareas con los filtros aplicados');
      }
      return new SuccessResponseModel(todos, todos.length, 'Tareas obtenidas correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener tareas:', error));
      return new ErrorResponseModel('Error al obtener tareas');
    }
  }

  /**
   * Obtiene una tarea específica por ID del usuario autenticado
   * @static
   * @async
   * @function getTodoById
   * @param {string} id - ID de la tarea
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea o error
   */
  static async getTodoById(id, userId) {
    try {
      const todo = await Todo.findOne({ _id: id, userId });
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
   * Busca tareas por título del usuario autenticado (búsqueda exacta)
   * @static
   * @async
   * @function getTodoByTitle
   * @param {string} title - Título exacto a buscar
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea encontrada o error
   * @example
   */
  static async getTodoByTitle(title, userId) {
    try {
      const todo = await Todo.findOne({ title, userId });
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
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la tarea creada o error
   * @example
   */
  static async createTodo(todoData, userId) {
    try {
      const createDto = new CreateTodoDto(todoData);
      const validation = createDto.validate();

      if (!validation.isValid) {
        return new ErrorResponseModel(validation.errors.join(', '));
      }

      const cleanData = createDto.toPlainObject();
      const todo = new Todo({
        ...cleanData,
        userId,
      });

      const savedTodo = await todo.save();
      return new CreatedResponseModel(savedTodo, 'Tarea creada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al crear tarea:', error));
      return new ErrorResponseModel('Error al crear tarea');
    }
  }

  /**
   * Actualiza una tarea del usuario autenticado
   * @static
   * @async
   * @function updateTodo
   * @param {string} id - ID de la tarea
   * @param {Object} todoData - Datos a actualizar
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea actualizada o error
   */
  static async updateTodo(id, todoData, userId) {
    try {
      const updateDto = new UpdateTodoDto(todoData);
      const validation = updateDto.validate();

      if (!validation.isValid) {
        return new ErrorResponseModel(validation.errors.join(', '));
      }

      const cleanData = updateDto.toPlainObject();
      const todo = await Todo.findOneAndUpdate({ _id: id, userId }, cleanData, {
        new: true,
        runValidators: true,
      });

      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }

      return new SuccessResponseModel(todo, 1, 'Tarea actualizada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar tarea:', error));
      return new ErrorResponseModel('Error al actualizar tarea');
    }
  }

  /**
   * Elimina una tarea del usuario autenticado
   * @static
   * @async
   * @function deleteTodo
   * @param {string} id - ID de la tarea
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación de eliminación o error
   */
  static async deleteTodo(id, userId) {
    try {
      const todo = await Todo.findOneAndDelete({ _id: id, userId });
      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }
      return new SuccessResponseModel(todo, 1, 'Tarea eliminada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar tarea:', error));
      return new ErrorResponseModel('Error al eliminar tarea');
    }
  }

  /**
   * Obtiene tareas por estado del usuario autenticado
   * @static
   * @async
   * @function getTodosByStatus
   * @param {boolean} completed - Estado de completado
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las tareas filtradas o error
   */
  static async getTodosByStatus(completed, userId) {
    try {
      const todos = await Todo.find({ completed, userId }).sort({ createdAt: -1 });
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

  /**
   * Obtiene tareas por meta del usuario autenticado
   * @static
   * @async
   * @function getTodosByGoalId
   * @param {string} goalId - ID de la meta
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las tareas de la meta o error
   */
  static async getTodosByGoalId(goalId, userId) {
    try {
      const todos = await Todo.find({ GoalId: goalId, userId }).sort({ createdAt: -1 });
      if (todos.length === 0) {
        return new NotFoundResponseModel(`No se encontraron tareas para la meta: ${goalId}`);
      }
      return new SuccessResponseModel(todos, todos.length, `Tareas para la meta: ${goalId} obtenidas correctamente`);
    } catch (error) {
      console.error(chalk.red('Error al obtener tareas por meta:', error));
      return new ErrorResponseModel('Error al obtener tareas por meta');
    }
  }

  /**
   * Obtiene tareas por prioridad del usuario autenticado
   * @static
   * @async
   * @function getTodosByPriority
   * @param {string} priority - Prioridad (low/medium/high)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las tareas filtradas o error
   */
  static async getTodosByPriority(priority, userId) {
    try {
      const todos = await Todo.find({ priority, userId }).sort({ createdAt: -1 });
      if (todos.length === 0) {
        return new NotFoundResponseModel(`No se encontraron tareas con prioridad: ${priority}`);
      }
      return new SuccessResponseModel(todos, todos.length, `Tareas con prioridad ${priority} obtenidas correctamente`);
    } catch (error) {
      console.error(chalk.red('Error al obtener tareas por prioridad:', error));
      return new ErrorResponseModel('Error al obtener tareas por prioridad');
    }
  }

  /**
   * Agrega un comentario a una tarea del usuario autenticado
   * @static
   * @async
   * @function addCommentToTodo
   * @param {string} todoId - ID de la tarea
   * @param {Object} commentData - Datos del comentario
   * @param {string} commentData.text - Texto del comentario (requerido)
   * @param {string} commentData.author - Autor del comentario (requerido)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea actualizada o error
   * @example
   * // Agregar comentario
   * await TodoService.addCommentToTodo('64f8a1b2c3d4e5f6a7b8c9d0', {
   *   text: '¡Gran avance!',
   *   author: 'Juan Pérez'
   * }, userId);
   */
  static async addCommentToTodo(todoId, commentData, userId) {
    try {
      // Validar datos del comentario usando DTO
      const commentDto = new AddCommentDto(commentData);
      const validation = commentDto.validate();

      if (!validation.isValid) {
        return new ErrorResponseModel(validation.errors.join(', '));
      }

      // Buscar la tarea
      const todo = await Todo.findOne({ _id: todoId, userId });

      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + todoId);
      }

      // Agregar el comentario
      const newComment = commentDto.toPlainObject();
      todo.comments.push(newComment);

      await todo.save();

      return new SuccessResponseModel(todo, 1, 'Comentario agregado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al agregar comentario:', error));
      return new ErrorResponseModel('Error al agregar comentario');
    }
  }
}
