import { z } from 'zod';
import { BaseValidationDto } from '../BaseValidationDto.js';
import { dueDateNotPastField, optionalDescriptionField, priorityField, titleField, validateZod } from '../zodHelpers.js';

/**
 * DTO para crear una nueva tarea
 */
export class CreateTodoDto extends BaseValidationDto {
  static schema = z.object({
    title: titleField,
    description: optionalDescriptionField,
    priority: priorityField.optional(),
    dueDate: dueDateNotPastField(),
    completed: z.boolean({ invalid_type_error: 'El estado completado debe ser un booleano' }).optional(),
    GoalId: z.string().nullable().optional(),
  });

  constructor(data) {
    super(data);
    this.description = data.description || '';
    this.priority = data.priority || 'medium';
    this.completed = data.completed !== undefined ? data.completed : false;
    this.GoalId = data.GoalId || null;
  }

  validate() {
    return validateZod(this.constructor.schema, {
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
