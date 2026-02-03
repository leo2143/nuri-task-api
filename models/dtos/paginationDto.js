import mongoose from 'mongoose';

export class PaginationDto {
  constructor(data) {
    this.cursor = data.cursor || null;
    this.limit = Number(data.limit) || 10;
  }

  /**
   * Valida los campos de paginación
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (this.limit < 1 || this.limit > 100) {
      errors.push('El límite debe estar entre 1 y 100');
    }

    // Validar que el cursor sea un ObjectId válido si existe
    if (this.cursor) {
      if (!mongoose.Types.ObjectId.isValid(this.cursor)) {
        errors.push('El cursor debe ser un ID válido');
      }
    }

    return { isValid: errors.length === 0, errors };
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
   * Aplica condición del cursor al query de MongoDB
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
