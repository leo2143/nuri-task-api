import Todo from '../models/todoModel.js';
import Goal from '../models/goalsModel.js';
import { MetricsService } from './metricsService.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import { CreateTodoDto, UpdateTodoDto, TodoFilterDto, AddCommentDto } from '../models/dtos/todo/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import chalk from 'chalk';

/**
 * Servicio para manejar la lógica de negocio de tareas (todos)
 */
export class TodoService {
  /**
   * Actualiza los contadores de tareas de un goal
   * @private
   */
  static async _updateGoalTaskCounters(goalId, label = 'Goal') {
    if (!goalId) return;

    try {
      const goal = await Goal.findById(goalId);
      if (goal) {
        await goal.updateTaskCount();
        await goal.save();
        console.log(
          chalk.blue(`${label} actualizado: ${goal.completedTasks}/${goal.totalTasks} tareas (${goal.progress}%)`)
        );
      }
    } catch (goalError) {
      console.error(chalk.yellow(`Error al actualizar ${label.toLowerCase()}:`, goalError));
    }
  }

  /**
   * Obtiene todas las tareas con filtros opcionales del usuario autenticado
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} [filters.search] - Término de búsqueda en título
   * @param {boolean} [filters.completed] - Filtrar por estado completado
   * @param {string} [filters.priority] - Filtrar por prioridad
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista resumida de tareas o error
   * Devuelve solo información mínima (id, title, completed, priority, dueDate, dates)
   * Para información completa, usar getTodoById
   */
  static async getAllTodos(filters = {}, userId) {
    try {
      const filterDto = new TodoFilterDto(filters);
      const validation = filterDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const query = { userId, ...filterDto.toMongoQuery() };
      const sort = filterDto.toMongoSort();

      const todos = await Todo.find(query)
        .select('title completed priority dueDate GoalId createdAt updatedAt')
        .sort(sort)
        .limit(filterDto.limit + 1)
        .lean();

      const { results, meta } = filterDto.processPaginationResults(todos);

      if (results.length === 0) {
        return new NotFoundResponseModel('No se encontraron tareas con los filtros aplicados');
      }

      return new SuccessResponseModel(results, 'Tareas obtenidas correctamente', 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener tareas');
    }
  }

  /**
   * Obtiene una tarea específica por ID del usuario autenticado
   * @param {string} id - ID de la tarea
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea o error
   * Incluye populate de userId (User) y GoalId (Goal mínimo) para obtener información completa
   */
  static async getTodoById(id, userId) {
    try {
      const todo = await Todo.findOne({ _id: id, userId });

      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }

      return new SuccessResponseModel(todo, 'Tarea obtenida correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener tarea');
    }
  }

  /**
   * Busca tareas por título del usuario autenticado (búsqueda exacta)
   * @param {string} title - Título exacto a buscar
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea encontrada o error
   */
  static async getTodoByTitle(title, userId) {
    try {
      const todo = await Todo.findOne({ title, userId });
      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el título: ' + title);
      }
      return new SuccessResponseModel(todo, 'Tarea obtenida correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener tarea por título');
    }
  }

  /**
   * Crea una nueva tarea para un usuario específico
   * @param {Object} todoData - Datos de la tarea a crear
   * @param {string} todoData.title - Título de la tarea (requerido)
   * @param {string} [todoData.description=''] - Descripción de la tarea
   * @param {string} [todoData.priority='medium'] - Prioridad (low/medium/high)
   * @param {Date} [todoData.dueDate=null] - Fecha límite de la tarea
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la tarea creada o error
   */
  static async createTodo(todoData, userId) {
    try {
      const createDto = new CreateTodoDto(todoData);
      const validation = createDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = createDto.toPlainObject();
      const todo = new Todo({
        ...cleanData,
        userId,
      });

      const savedTodo = await todo.save();

      // Actualizar contadores del goal si está asociado
      await this._updateGoalTaskCounters(savedTodo.GoalId, 'Goal');

      return new CreatedResponseModel(savedTodo, 'Tarea creada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'crear tarea');
    }
  }

  /**
   * Actualiza una tarea del usuario autenticado
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
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const currentTodo = await Todo.findOne({ _id: id, userId });
      if (!currentTodo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }

      const oldGoalId = currentTodo.GoalId?.toString();
      const newGoalId = todoData.GoalId?.toString();

      const cleanData = updateDto.toPlainObject();
      const todo = await Todo.findOneAndUpdate({ _id: id, userId }, cleanData, {
        new: true,
        runValidators: true,
      });

      // Actualizar contadores si cambió el goal
      if (oldGoalId !== newGoalId) {
        await this._updateGoalTaskCounters(oldGoalId, 'Goal anterior');
        await this._updateGoalTaskCounters(newGoalId, 'Goal nuevo');
      }

      return new SuccessResponseModel(todo, 'Tarea actualizada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar tarea');
    }
  }

  /**
   * Actualiza solo el estado (completed) de una tarea
   * Actualiza métricas del usuario y progreso del goal automáticamente
   * @param {string} id - ID de la tarea
   * @param {boolean} completed - Nuevo estado de completado (true/false)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea actualizada o error
   */
  static async updateTodoState(id, completed, userId) {
    try {
      // Validar que el parámetro completed sea un booleano
      if (typeof completed !== 'boolean') {
        return new BadRequestResponseModel('El campo completed debe ser un booleano (true/false)');
      }

      const existingTodo = await Todo.findOne({ _id: id, userId });

      if (!existingTodo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }

      const wasCompleted = existingTodo.completed;

      existingTodo.completed = completed;
      await existingTodo.save();

      if (!wasCompleted && completed === true) {
        try {
          await MetricsService.recordTaskCompleted(userId);
        } catch (metricsError) {
          console.error(chalk.yellow('Error al actualizar métricas del usuario:', metricsError));
        }
      }

      // Actualizar progreso del goal
      await this._updateGoalTaskCounters(existingTodo.GoalId, 'Goal');

      return new SuccessResponseModel(
        existingTodo,
        `Tarea ${completed ? 'completada' : 'marcada como pendiente'} correctamente`
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar estado de la tarea');
    }
  }

  /**
   * Elimina una tarea del usuario autenticado
   * @param {string} id - ID de la tarea
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación de eliminación o error
   */
  static async deleteTodo(id, userId) {
    try {
      const todo = await Todo.findOne({ _id: id, userId });
      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }

      const goalId = todo.GoalId;

      await Todo.findByIdAndDelete(id);

      // Actualizar contadores del goal si existía
      await this._updateGoalTaskCounters(goalId, 'Goal');

      return new SuccessResponseModel(todo, 'Tarea eliminada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar tarea');
    }
  }

  /**
   * Obtiene tareas por estado del usuario autenticado
   * @param {boolean} completed - Estado de completado
   * @param {string} userId - ID del usuario autenticado
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las tareas filtradas o error
   */
  static async getTodosByStatus(completed, userId, pagination = {}) {
    try {
      const paginationDto = new TodoFilterDto(pagination);
      const query = { completed, userId };
      paginationDto.applyCursorToQuery(query);

      const todos = await Todo.find(query)
        .sort({ createdAt: -1 })
        .limit(paginationDto.limit + 1)
        .lean();

      const { results, meta } = paginationDto.processPaginationResults(todos);

      if (results.length === 0) {
        return new NotFoundResponseModel(`No se encontraron tareas ${completed ? 'completadas' : 'pendientes'}`);
      }
      return new SuccessResponseModel(
        results,
        `Tareas ${completed ? 'completadas' : 'pendientes'} obtenidas correctamente`,
        200,
        meta
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener tareas por estado');
    }
  }

  /**
   * Obtiene tareas por meta del usuario autenticado
   * @param {string} goalId - ID de la meta
   * @param {string} userId - ID del usuario autenticado
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las tareas de la meta o error
   */
  static async getTodosByGoalId(goalId, userId, pagination = {}) {
    try {
      const paginationDto = new TodoFilterDto(pagination);
      const query = { GoalId: goalId, userId };
      paginationDto.applyCursorToQuery(query);

      const todos = await Todo.find(query)
        .sort({ createdAt: -1 })
        .limit(paginationDto.limit + 1)
        .lean();

      const { results, meta } = paginationDto.processPaginationResults(todos);

      if (results.length === 0) {
        return new NotFoundResponseModel(`No se encontraron tareas para la meta: ${goalId}`);
      }
      return new SuccessResponseModel(results, `Tareas para la meta: ${goalId} obtenidas correctamente`, 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener tareas por meta');
    }
  }

  /**
   * Obtiene tareas por prioridad del usuario autenticado
   * @param {string} priority - Prioridad (low/medium/high)
   * @param {string} userId - ID del usuario autenticado
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las tareas filtradas o error
   */
  static async getTodosByPriority(priority, userId, pagination = {}) {
    try {
      const paginationDto = new TodoFilterDto(pagination);
      const query = { priority, userId };
      paginationDto.applyCursorToQuery(query);

      const todos = await Todo.find(query)
        .sort({ createdAt: -1 })
        .limit(paginationDto.limit + 1)
        .lean();

      const { results, meta } = paginationDto.processPaginationResults(todos);

      if (results.length === 0) {
        return new NotFoundResponseModel(`No se encontraron tareas con prioridad: ${priority}`);
      }
      return new SuccessResponseModel(results, `Tareas con prioridad ${priority} obtenidas correctamente`, 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener tareas por prioridad');
    }
  }
  //TODO: los comentarios ya no van a ir dentro de la app, eliminarlos
  /**
   * Agrega un comentario a una tarea del usuario autenticado
   * @param {string} todoId - ID de la tarea
   * @param {Object} commentData - Datos del comentario
   * @param {string} commentData.text - Texto del comentario (requerido)
   * @param {string} commentData.author - Autor del comentario (requerido)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea actualizada o error
   */
  static async addCommentToTodo(todoId, commentData, userId) {
    try {
      const commentDto = new AddCommentDto(commentData);
      const validation = commentDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const todo = await Todo.findOne({ _id: todoId, userId });

      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + todoId);
      }

      const newComment = commentDto.toPlainObject();
      todo.comments.push(newComment);

      await todo.save();

      return new SuccessResponseModel(todo, 'Comentario agregado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'agregar comentario');
    }
  }
}
