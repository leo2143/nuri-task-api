import { z } from 'zod';
import { PaginationDto } from '../paginationDto.js';
import { goalStatusField, mergeValidations, optionalDateField, priorityField, sortOrderField, validateZod } from '../zodHelpers.js';

/**
 * DTO para filtrar metas
 * @class GoalFilterDto
 * @extends PaginationDto
 * @description Define la estructura y validaciones para filtrar metas
 */
export class GoalFilterDto extends PaginationDto {
  /**
   * @param {Object} data - Filtros de búsqueda
   * @param {string} [data.status] - Estado de la meta (active/paused/completed)
   * @param {string} [data.priority] - Prioridad de la meta (low/medium/high)
   * @param {string} [data.search] - Término de búsqueda para título o descripción
   * @param {Date|string} [data.dueDateFrom] - Fecha límite desde
   * @param {Date|string} [data.dueDateTo] - Fecha límite hasta
   * @param {string} [data.sortOrder] - Orden de clasificación (asc/desc)
   * @param {string} [data.cursor] - Cursor para paginación
   * @param {number} [data.limit] - Límite de resultados por página
   */
  constructor(data) {
    super(data);
    if (data.status !== undefined) this.status = data.status;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.search !== undefined) this.search = data.search;
    if (data.dueDateFrom !== undefined) this.dueDateFrom = data.dueDateFrom;
    if (data.dueDateTo !== undefined) this.dueDateTo = data.dueDateTo;
    this.sortOrder = data.sortOrder || 'desc';
    if (data.parentGoalId !== undefined) this.parentGoalId = data.parentGoalId;
  }

  /**
   * Valida que los filtros sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  static schema = z.object({
    status: goalStatusField.optional(),
    priority: priorityField.optional(),
    search: z.string().optional(),
    dueDateFrom: optionalDateField,
    dueDateTo: optionalDateField,
    sortOrder: sortOrderField.optional(),
    parentGoalId: z.string().optional(),
  });

  validate() {
    return mergeValidations(
      super.validate(),
      validateZod(GoalFilterDto.schema, {
        status: this.status,
        priority: this.priority,
        search: this.search,
        dueDateFrom: this.dueDateFrom,
        dueDateTo: this.dueDateTo,
        sortOrder: this.sortOrder,
        parentGoalId: this.parentGoalId,
      })
    );
  }

  /**
   * Construye el query object para MongoDB
   * @returns {Object} Query object para MongoDB
   */
  toMongoQuery() {
    const query = {};

    if (this.status !== undefined) {
      query.status = this.status;
    }

    if (this.priority !== undefined) {
      query.priority = this.priority;
    }

    if (this.search !== undefined && this.search.trim() !== '') {
      query.$or = [
        { title: { $regex: this.search.trim(), $options: 'i' } },
        { description: { $regex: this.search.trim(), $options: 'i' } },
      ];
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

    if (this.parentGoalId !== undefined) {
      query.parentGoalId = this.parentGoalId;
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
