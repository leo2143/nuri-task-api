import { z } from 'zod';
import { PaginationDto } from '../paginationDto.js';
import { mergeValidations, optionalDateField, queryBooleanField, sortOrderField, validateZod } from '../zodHelpers.js';

/**
 * DTO para filtrar usuarios
 * @class UserFilterDto
 * @extends PaginationDto
 * @description Define la estructura y validaciones para filtrar usuarios
 */
export class UserFilterDto extends PaginationDto {
  /**
   * @param {Object} data - Filtros de búsqueda
   * @param {string} [data.search] - Término de búsqueda para nombre o email
   * @param {boolean} [data.isAdmin] - Filtrar por administradores
   * @param {boolean} [data.isSubscribed] - Filtrar por usuarios con suscripción activa
   * @param {Date|string} [data.createdFrom] - Usuario creado desde
   * @param {Date|string} [data.createdTo] - Usuario creado hasta
   * @param {string} [data.sortOrder] - Orden de clasificación (asc/desc)
   * @param {string} [data.cursor] - Cursor para paginación
   * @param {number} [data.limit] - Límite de resultados por página
   */
  constructor(data) {
    super(data);
    if (data.search !== undefined) this.search = data.search;
    if (data.isAdmin !== undefined) this.isAdmin = data.isAdmin;
    if (data.isSubscribed !== undefined) this.isSubscribed = data.isSubscribed;
    if (data.createdFrom !== undefined) this.createdFrom = data.createdFrom;
    if (data.createdTo !== undefined) this.createdTo = data.createdTo;
    this.sortOrder = data.sortOrder || 'desc';
  }

  /**
   * Valida que los filtros sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  static schema = z.object({
    search: z.string().optional(),
    isAdmin: queryBooleanField.optional(),
    isSubscribed: queryBooleanField.optional(),
    createdFrom: optionalDateField,
    createdTo: optionalDateField,
    sortOrder: sortOrderField.optional(),
  });

  validate() {
    return mergeValidations(
      super.validate(),
      validateZod(UserFilterDto.schema, {
        search: this.search,
        isAdmin: this.isAdmin,
        isSubscribed: this.isSubscribed,
        createdFrom: this.createdFrom,
        createdTo: this.createdTo,
        sortOrder: this.sortOrder,
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
      query.$or = [
        { name: { $regex: this.search.trim(), $options: 'i' } },
        { email: { $regex: this.search.trim(), $options: 'i' } },
      ];
    }

    if (this.isAdmin !== undefined) {
      query.isAdmin = this.isAdmin === 'true' || this.isAdmin === true;
    }

    if (this.isSubscribed !== undefined) {
      const isSubscribed = this.isSubscribed === 'true' || this.isSubscribed === true;
      query['subscription.isActive'] = isSubscribed;
    }

    if (this.createdFrom !== undefined || this.createdTo !== undefined) {
      query.createdAt = {};
      if (this.createdFrom !== undefined) {
        query.createdAt.$gte = new Date(this.createdFrom);
      }
      if (this.createdTo !== undefined) {
        query.createdAt.$lte = new Date(this.createdTo);
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
