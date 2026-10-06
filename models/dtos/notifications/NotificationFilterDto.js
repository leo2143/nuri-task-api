import { z } from 'zod';
import { PaginationDto } from '../paginationDto.js';
import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';
import { mergeValidations, queryBooleanField, validateZod } from '../zodHelpers.js';

const NOTIFICATION_TYPES = ['due_task', 'streak_risk', 'inactivity', 'streak_increase', 'achievement_completed'];

/**
 * DTO para filtrar y paginar notificaciones
 * @class NotificationFilterDto
 * @extends PaginationDto
 */
export class NotificationFilterDto extends PaginationDto {
  constructor(data) {
    super(data);
    if (data.read !== undefined) this.read = ValidationHelpers.parseBoolean(data.read);
    if (data.type !== undefined) this.type = data.type;
  }

  static schema = z.object({
    read: queryBooleanField.optional(),
    type: z.enum(NOTIFICATION_TYPES, { errorMap: () => ({ message: `El tipo debe ser uno de: ${NOTIFICATION_TYPES.join(', ')}` }) }).optional(),
  });

  validate() {
    return mergeValidations(
      super.validate(),
      validateZod(NotificationFilterDto.schema, {
        read: this.read === null ? 'invalid' : this.read,
        type: this.type,
      })
    );
  }

  toMongoQuery() {
    const query = {};

    if (this.read !== undefined && this.read !== null) {
      query.read = this.read;
    }

    if (this.type !== undefined) {
      query.type = this.type;
    }

    this.applyCursorToQuery(query);
    return query;
  }
}
