import mongoose from 'mongoose';
import { paginationSchema, validateZod } from './zodHelpers.js';

/**
 * Cursor + limit. No tiene toPlainObject: los hijos usan toMongoQuery / applyCursorToQuery.
 */
export class PaginationDto {
  static schema = paginationSchema;

  constructor(data) {
    this.cursor = data.cursor || null;
    this.limit = Number(data.limit) || 10;
  }

  /**
   * Valida los campos de paginación
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validate() {
    return validateZod(PaginationDto.schema, { cursor: this.cursor, limit: this.limit });
  }

  /**
   * Procesa los resultados y calcula la metadata de paginación
   * @param {Array} items - Array de resultados (debe incluir limit + 1)
   * @returns {{ results: Array, meta: Object }}
   */
  processPaginationResults(items) {
    const hasMore = items.length > this.limit;
    const results = hasMore ? items.slice(0, this.limit) : items;
    // Solo generar nextCursor si hay más registros
    const nextCursor = hasMore && results.length > 0 ? results[results.length - 1]._id.toString() : null;

    return {
      results,
      meta: {
        count: results.length,
        nextCursor,
        hasMore,
        limit: this.limit,
      },
    };
  }

  /**
   * Sort alineado al cursor. ObjectId es cronológico (≈ createdAt) y usa el índice nativo.
   * @param {string} sortOrder - 'asc' | 'desc'
   * @returns {{ _id: 1 | -1 }}
   */
  toMongoSort(sortOrder = 'desc') {
    return { _id: sortOrder === 'asc' ? 1 : -1 };
  }

  /**
   * Aplica condición del cursor al query de MongoDB.
   * El sort del find tiene que ser `{ _id }` con el mismo sortOrder.
   * @param {Object} query - Query object existente
   * @param {string} sortOrder - Orden de clasificación ('asc' o 'desc')
   * @returns {Object} Query con cursor agregado
   */
  applyCursorToQuery(query, sortOrder = 'desc') {
    if (this.cursor) {
      const operator = sortOrder === 'asc' ? '$gt' : '$lt';
      query._id = { [operator]: mongoose.Types.ObjectId.createFromHexString(this.cursor) };
    }
    return query;
  }
}
