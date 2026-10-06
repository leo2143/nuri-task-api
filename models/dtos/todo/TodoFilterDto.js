import { z } from 'zod';
import { PaginationDto } from '../paginationDto.js';
import { mergeValidations, optionalDateField, priorityField, queryBooleanField, sortOrderField, validateZod } from '../zodHelpers.js';

/**
 * DTO para filtrar tareas
 * @class TodoFilterDto
 * @description Define la estructura y validaciones para filtrar tareas
 */
export class TodoFilterDto extends PaginationDto {
  /**
   * @param {Object} data - Filtros de búsqueda
   * @param {string} [data.search] - Término de búsqueda para título
   * @param {boolean} [data.completed] - Filtrar por estado completado
   * @param {string} [data.priority] - Prioridad (low/medium/high)
   * @param {string} [data.GoalId] - Filtrar por meta específica
   * @param {Date|string} [data.dueDateFrom] - Fecha límite desde
   * @param {Date|string} [data.dueDateTo] - Fecha límite hasta
   * @param {string} [data.sortOrder] - Orden de clasificación (asc/desc)
   */
  constructor(data) {
    super(data);
    if (data.search !== undefined) this.search = data.search;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.GoalId !== undefined) this.GoalId = data.GoalId;
    if (data.dueDateFrom !== undefined) this.dueDateFrom = data.dueDateFrom;
    if (data.dueDateTo !== undefined) this.dueDateTo = data.dueDateTo;
    this.sortOrder = data.sortOrder || 'desc';
  }

  /**
   * Valida que los filtros sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  static schema = z.object({
    completed: queryBooleanField.optional(),
    priority: priorityField.optional(),
    dueDateFrom: optionalDateField,
    dueDateTo: optionalDateField,
    sortOrder: sortOrderField.optional(),
    search: z.string().optional(),
    GoalId: z.string().optional(),
  });

  validate() {
    return mergeValidations(
      super.validate(),
      validateZod(TodoFilterDto.schema, {
        completed: this.completed,
        priority: this.priority,
        dueDateFrom: this.dueDateFrom,
        dueDateTo: this.dueDateTo,
        sortOrder: this.sortOrder,
        search: this.search,
        GoalId: this.GoalId,
      })
    );
  }

  /**
   * Construye el query object para MongoDB
   * @returns {Object} Query object para MongoDB
   */
  toMongoQuery() {
    const query = {};

    if (this.search !== undefined && this.search.trim() !== '') {
      query.title = { $regex: this.search.trim(), $options: 'i' };
    }

    if (this.completed !== undefined) {
      // Convertir a booleano si viene como string
      query.completed = this.completed === 'true' || this.completed === true;
    }

    if (this.priority !== undefined) {
      query.priority = this.priority;
    }

    if (this.GoalId !== undefined) {
      query.GoalId = this.GoalId;
    }

    if (this.dueDateFrom !== undefined || this.dueDateTo !== undefined) {
      query.dueDate = {};
      if (this.dueDateFrom !== undefined) {
        query.dueDate.$gte = new Date(this.dueDateFrom);
      }
      if (this.dueDateTo !== undefined) {
        query.dueDate.$lte = new Date(this.dueDateTo);
      }
    }
    this.applyCursorToQuery(query, this.sortOrder);

    return query;
  }

  /**
   * Ordena por `_id` (alineado al cursor). Default desc = más recientes primero.
   * @returns {{ _id: 1 | -1 }}
   */
  toMongoSort() {
    return super.toMongoSort(this.sortOrder);
  }
}
