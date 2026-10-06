import { z } from 'zod';
import { UpdateTodoDto } from './UpdateTodoDto.js';
import { validateZod } from '../zodHelpers.js';

/**
 * Body de PATCH completed.
 */
export class UpdateTodoStateDto extends UpdateTodoDto {
  static schema = z.object({
    completed: z.boolean({
      required_error: 'El campo completed es requerido',
      invalid_type_error: 'El estado completado debe ser un booleano',
    }),
  });

  constructor(data = {}) {
    super({});
    if (Object.prototype.hasOwnProperty.call(data, 'completed')) {
      this.completed = data.completed;
    } else {
      this.completed = undefined;
    }
  }

  validate() {
    return validateZod(this.constructor.schema, { completed: this.completed });
  }

  toPlainObject() {
    return {
      completed: this.completed,
    };
  }
}
