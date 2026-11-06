import { z } from 'zod';
import { BaseValidationDto } from '../BaseValidationDto.js';
import { dueDateNotPastField, optionalDescriptionField, priorityField, titleField, validateZod } from '../zodHelpers.js';

/**
 * DTO para crear una nueva tarea
 */
export class CreateTodoDto extends BaseValidationDto {
  /**
   * @param {string} [todayYmd] - Hoy (YYYY-MM-DD) del usuario para validar que la fecha límite no sea pasada
   */
  static buildSchema(todayYmd) {
    return z.object({
      title: titleField,
      description: optionalDescriptionField,
      priority: priorityField.optional(),
      dueDate: dueDateNotPastField({ todayYmd }),
      completed: z.boolean({ invalid_type_error: 'El estado completado debe ser un booleano' }).optional(),
      GoalId: z.string().nullable().optional(),
    });
  }

  static schema = CreateTodoDto.buildSchema();

  /**
   * @param {Object} data - Datos de la tarea
   * @param {Object} [options]
   * @param {string} [options.todayYmd] - Hoy (YYYY-MM-DD) del usuario; por defecto, hoy en la zona de producto
   */
  constructor(data, { todayYmd } = {}) {
    super(data);
    this.todayYmd = todayYmd;
    this.description = data.description || '';
    this.priority = data.priority || 'medium';
    this.completed = data.completed !== undefined ? data.completed : false;
    this.GoalId = data.GoalId || null;
  }

  validate() {
    return validateZod(CreateTodoDto.buildSchema(this.todayYmd), {
      title: this.title,
      description: this.description,
      priority: this.priority,
      dueDate: this.dueDate,
      completed: this.completed,
      GoalId: this.GoalId,
    });
  }

  toPlainObject() {
    const baseData = super.toPlainObject();
    const result = {
      ...baseData,
      description: this.description.trim(),
      completed: this.completed,
    };

    if (this.GoalId) {
      result.GoalId = this.GoalId;
    }

    return result;
  }
}
