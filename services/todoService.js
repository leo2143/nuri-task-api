import Todo from '../models/todoModel.js';
import Goal from '../models/goalsModel.js';
import User from '../models/userModel.js';
import { MetricsService } from './metricsService.js';
import { UserAchievementService } from './userAchievementService.js';
import {
  NotFoundResponseModel,
  ErrorResponseModel,
  BadRequestResponseModel,
  ForbiddenResponseModel,
} from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import {
  CreateTodoDto,
  UpdateTodoDto,
  UpdateTodoStateDto,
  TodoFilterDto,
  AddCommentDto,
} from '../models/dtos/todo/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { findOwnedGoal } from './helpers/goalOwnership.js';
import { runWithOneRetry } from './helpers/runWithOneRetry.js';
import { assertGoalOpen } from './helpers/goalOpenGuard.js';
import { getDueDateChangeError } from './helpers/dueDateRules.js';
import { touchLastChildActivity } from './helpers/goalActivity.js';
import { buildCompletionEvents, emptyCompletionEvents } from './helpers/completionEvents.js';
import chalk from 'chalk';

const CONFIRMED_TODO_MESSAGE = 'Esta tarea ya fue confirmada y no se puede modificar';

/**
 * Servicio para manejar la lógica de negocio de tareas (todos)
 */
export class TodoService {
  /**
   * Respuesta de una tarea completada junto con los eventos de la completación (vacíos si no fue este request).
   * @private
   */
  static _buildCompletedTodoResponse(todo, events) {
    return new SuccessResponseModel(todo, 'Tarea completada correctamente', 200, { events });
  }

  /**
   * Actualiza los contadores de tareas de un goal
   * @private
   */
  static async _updateGoalTaskCounters(goalId, userId, label = 'Goal') {
    if (!goalId) return;

    await runWithOneRetry(async () => {
      const goal = await Goal.findOne({ _id: goalId, userId });
      if (!goal) return;

      await goal.updateTaskCount();
      await goal.save();
      console.log(
        chalk.blue(`${label} actualizado: ${goal.completedTasks}/${goal.totalTasks} tareas (${goal.progress}%)`)
      );
    }, `actualizar contadores de ${label.toLowerCase()}`);
  }

  /**
   * Obtiene todas las tareas con filtros opcionales del usuario autenticado
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} [filters.search] - Término de búsqueda en título
   * @param {boolean} [filters.completed] - Filtrar por estado completado
   * @param {string} [filters.priority] - Filtrar por prioridad
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista resumida de tareas o error
   * Devuelve información mínima (id, title, completed, priority, dueDate, dates, goalId, goalTitle)
   * Incluye el ID y título de la meta asociada si existe
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
        .populate('GoalId', 'title')
        .select('title completed priority dueDate GoalId createdAt updatedAt')
        .sort(sort)
        .limit(filterDto.limit + 1)
        .lean();

      const { results, meta } = filterDto.processPaginationResults(todos);

      if (results.length === 0) {
        return new NotFoundResponseModel('No se encontraron tareas con los filtros aplicados');
      }

      const transformedResults = results.map(todo => {
        const goalId = todo.GoalId?._id?.toString() || todo.GoalId?.toString() || null;
        const { GoalId, ...rest } = todo;
        return {
          ...rest,
          goalId,
          goalTitle: todo.GoalId?.title || null,
        };
      });

      return new SuccessResponseModel(transformedResults, 'Tareas obtenidas correctamente', 200, meta);
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
   * Crea una nueva tarea para un usuario específico
   * @param {Object} todoData - Datos de la tarea a crear
   * @param {string} todoData.title - Título de la tarea (requerido)
   * @param {string} [todoData.description=''] - Descripción de la tarea
   * @param {string} [todoData.priority='medium'] - Prioridad (low/medium/high)
   * @param {Date} [todoData.dueDate=null] - Fecha límite de la tarea
   * @param {string} userId - ID del usuario autenticado
   * @param {Object} [options]
   * @param {string} [options.todayYmd] - Hoy (YYYY-MM-DD) del usuario, para validar la fecha límite
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la tarea creada o error
   */
  static async createTodo(todoData, userId, { todayYmd } = {}) {
    try {
      const createDto = new CreateTodoDto(todoData, { todayYmd });
      const validation = createDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = createDto.toPlainObject();

      if (cleanData.GoalId) {
        const { error: goalError } = await findOwnedGoal(cleanData.GoalId, userId);
        if (goalError) {
          return goalError;
        }

        const completedGoalConflict = await assertGoalOpen(cleanData.GoalId, userId);
        if (completedGoalConflict) {
          return completedGoalConflict;
        }
      }

      const todo = new Todo({
        ...cleanData,
        userId,
      });

      const savedTodo = await todo.save();

      // Actualizar contadores del goal si está asociado
      await this._updateGoalTaskCounters(savedTodo.GoalId, userId, 'Goal');
      await touchLastChildActivity(savedTodo.GoalId, userId);

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

      if (currentTodo.completed || currentTodo.isLocked) {
        return new BadRequestResponseModel(CONFIRMED_TODO_MESSAGE);
      }

      const cleanData = updateDto.toPlainObject();

      // La fecha límite solo se valida si cambia respecto de la guardada
      const dueDateError = getDueDateChangeError(cleanData.dueDate, currentTodo.dueDate);
      if (dueDateError) {
        return new BadRequestResponseModel(dueDateError);
      }

      if (cleanData.GoalId) {
        const { error: goalError } = await findOwnedGoal(cleanData.GoalId, userId);
        if (goalError) {
          return goalError;
        }
      }

      const oldGoalId = currentTodo.GoalId?.toString();
      const newGoalId = cleanData.GoalId !== undefined ? cleanData.GoalId?.toString() : oldGoalId;

      // Solo mover una tarea HACIA una meta completada es conflicto; editar una tarea que ya vive en ella no lo es
      if (oldGoalId !== newGoalId) {
        const completedGoalConflict = await assertGoalOpen(newGoalId, userId);
        if (completedGoalConflict) {
          return completedGoalConflict;
        }
      }

      const todo = await Todo.findOneAndUpdate({ _id: id, userId }, cleanData, {
        new: true,
        runValidators: true,
      });

      // Actualizar contadores si cambió el goal
      if (oldGoalId !== newGoalId) {
        await this._updateGoalTaskCounters(oldGoalId, userId, 'Goal anterior');
        await this._updateGoalTaskCounters(newGoalId, userId, 'Goal nuevo');
        await touchLastChildActivity(newGoalId, userId);
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
   * @param {Object} body - Body con completed
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea actualizada o error
   */
  static async updateTodoState(id, body, userId) {
    try {
      const stateDto = new UpdateTodoStateDto(body || {});
      const validation = stateDto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { completed } = stateDto.toPlainObject();

      const existingTodo = await Todo.findOne({ _id: id, userId });

      if (!existingTodo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
      }

      if (completed === false) {
        if (existingTodo.completed || existingTodo.isLocked) {
          return new BadRequestResponseModel(CONFIRMED_TODO_MESSAGE);
        }

        await this._updateGoalTaskCounters(existingTodo.GoalId, userId, 'Goal');
        return new SuccessResponseModel(existingTodo, 'Tarea marcada como pendiente correctamente', 200, {
          events: emptyCompletionEvents(),
        });
      }

      // Una tarea ya completada (con o sin lock, incluidas las legacy) es éxito idempotente y sin efectos
      if (existingTodo.completed) {
        return this._buildCompletedTodoResponse(existingTodo, emptyCompletionEvents());
      }

      // Reclamo atómico: solo el request que gana pasa de pendiente a completada y dispara métricas y logros
      const completedAt = new Date();
      const claimedTodo = await Todo.findOneAndUpdate(
        { _id: id, userId, completed: false, isLocked: false },
        { $set: { completed: true, isLocked: true, completedAt } },
        { new: true }
      );

      if (!claimedTodo) {
        const latestTodo = await Todo.findOne({ _id: id, userId });
        if (latestTodo?.completed) {
          return this._buildCompletedTodoResponse(latestTodo, emptyCompletionEvents());
        }
        if (!latestTodo) {
          return new NotFoundResponseModel('No se encontró la tarea con el id: ' + id);
        }
        return new BadRequestResponseModel(CONFIRMED_TODO_MESSAGE);
      }

      // Contadores y actividad de la meta son efectos secundarios: si fallan no deben saltear métricas ni eventos del reclamo
      try {
        await this._updateGoalTaskCounters(claimedTodo.GoalId, userId, 'Goal');
        await touchLastChildActivity(claimedTodo.GoalId, userId);
      } catch (sideEffectError) {
        console.error(
          chalk.yellow('[side-effect] Error al actualizar la meta de la tarea completada:'),
          sideEffectError
        );
      }

      // La escritura atómica de métricas es lo único que se reintenta; sus efectos posteriores no (ver MetricsService)
      const metricsResult = await MetricsService.writeTaskMetrics(userId, { occurredAt: claimedTodo.completedAt });
      if (!metricsResult.success) {
        return metricsResult;
      }
      const streakResult = await MetricsService.afterActivityMetrics(userId, metricsResult.data);

      // occurredAt es el reloj del servidor del reclamo; los logros con condiciones lo consumen (S5)
      const taskEvent = await UserAchievementService.processEvent('task:completed', userId, null, {
        occurredAt: claimedTodo.completedAt,
      });

      let events = emptyCompletionEvents();
      try {
        const { streakIncreased, currentStreak } = metricsResult.data;
        events = buildCompletionEvents({
          taskCompleted: { id: claimedTodo._id.toString(), title: claimedTodo.title },
          streak: { increased: streakIncreased, current: currentStreak },
          achievementsUnlocked: [...streakResult.achievementsUnlocked, ...(taskEvent?.achievementsUnlocked ?? [])],
        });
      } catch (eventError) {
        console.error(chalk.yellow('[side-effect] Error al armar eventos de tarea completada:'), eventError);
      }

      return this._buildCompletedTodoResponse(claimedTodo, events);
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

      if (todo.completed || todo.isLocked) {
        const user = await User.findById(userId).select('isAdmin').lean();
        if (!user?.isAdmin) {
          return new ForbiddenResponseModel('Solo un administrador puede eliminar una tarea confirmada');
        }
      }

      const goalId = todo.GoalId;

      todo.deleted_at = new Date();
      await todo.save();

      await this._updateGoalTaskCounters(goalId, userId, 'Goal');

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
        .sort(paginationDto.toMongoSort())
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
        .sort(paginationDto.toMongoSort())
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
        .sort(paginationDto.toMongoSort())
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
   * @param {string} userId - ID del usuario autenticado
   * @param {string} authorName - Nombre del usuario del token
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la tarea actualizada o error
   */
  static async addCommentToTodo(todoId, commentData, userId, authorName) {
    try {
      if (!authorName || typeof authorName !== 'string' || authorName.trim().length < 2) {
        return new BadRequestResponseModel('No se pudo determinar el autor del comentario');
      }

      const commentDto = new AddCommentDto(commentData);
      const validation = commentDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const todo = await Todo.findOne({ _id: todoId, userId });

      if (!todo) {
        return new NotFoundResponseModel('No se encontró la tarea con el id: ' + todoId);
      }

      const newComment = {
        ...commentDto.toPlainObject(),
        author: authorName.trim(),
      };
      todo.comments.push(newComment);

      await todo.save();

      return new SuccessResponseModel(todo, 'Comentario agregado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'agregar comentario');
    }
  }
}
