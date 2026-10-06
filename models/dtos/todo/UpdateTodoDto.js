import { z } from 'zod';
import { CreateTodoDto } from './CreateTodoDto.js';
import { dueDateNotPastField, optionalDescriptionField, optionalTitleField, priorityField, validateZod } from '../zodHelpers.js';

/**
 * DTO para actualizar una tarea existente
 */
export class UpdateTodoDto extends CreateTodoDto {
  static schema = z.object({
    title: optionalTitleField,
    description: optionalDescriptionField,
    priority: priorityField.optional(),
    dueDate: dueDateNotPastField(),
    completed: z.boolean({ invalid_type_error: 'El estado completado debe ser un booleano' }).optional(),
    GoalId: z.string().nullable().optional(),
  });

  constructor(data) {
    super({});
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.GoalId !== undefined) this.GoalId = data.GoalId;
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
    const result = {};

    if (this.title !== undefined) result.title = this.title.trim();
    if (this.description !== undefined) result.description = this.description.trim();
    if (this.priority !== undefined) result.priority = this.priority;
    if (this.dueDate !== undefined) result.dueDate = this.dueDate;
    if (this.completed !== undefined) result.completed = this.completed;
    if (this.GoalId !== undefined) result.GoalId = this.GoalId;

    return result;
  }
}
