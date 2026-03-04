import { PaginationDto } from '../paginationDto.js';

/**
 * DTO para filtrar y paginar notificaciones
 * @class NotificationFilterDto
 * @extends PaginationDto
 */
export class NotificationFilterDto extends PaginationDto {
  constructor(data) {
    super(data);
    if (data.read !== undefined) this.read = data.read;
    if (data.type !== undefined) this.type = data.type;
  }

  validate() {
    const parentValidation = super.validate();
    const errors = [...parentValidation.errors];

    if (this.read !== undefined) {
      if (this.read !== 'true' && this.read !== 'false' && typeof this.read !== 'boolean') {
        errors.push('El filtro read debe ser "true" o "false"');
      }
    }

    if (this.type !== undefined) {
      const validTypes = ['due_task', 'streak_risk', 'inactivity', 'streak_increase'];
      if (!validTypes.includes(this.type)) {
        errors.push(`El tipo debe ser uno de: ${validTypes.join(', ')}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  toMongoQuery() {
    const query = {};

    if (this.read !== undefined) {
      query.read = this.read === 'true' || this.read === true;
    }

    if (this.type !== undefined) {
      query.type = this.type;
    }

    this.applyCursorToQuery(query);
    return query;
  }
}
