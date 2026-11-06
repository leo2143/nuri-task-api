import { z } from 'zod';
import { CreateTodoDto } from './CreateTodoDto.js';
import { optionalDescriptionField, optionalDueDateField, optionalTitleField, priorityField, validateZod } from '../zodHelpers.js';

/**
 * DTO para actualizar una tarea existente
 */
export class UpdateTodoDto extends CreateTodoDto {
  static schema = z.object({
    title: optionalTitleField,
    description: optionalDescriptionField,
    priority: priorityField.optional(),
    dueDate: optionalDueDateField,
    GoalId: z.string().nullable().optional(),
  });

  constructor(data) {
    super({});
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.GoalId !== undefined) this.GoalId = data.GoalId;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      title: this.title,
      description: this.description,
      priority: this.priority,
      dueDate: this.dueDate,
      GoalId: this.GoalId,
    });
  }

  toPlainObject() {
    const result = {};

    if (this.title !== undefined) result.title = this.title.trim();
    if (this.description !== undefined) result.description = this.description.trim();
    if (this.priority !== undefined) result.priority = this.priority;
    if (this.dueDate !== undefined) result.dueDate = this.dueDate;
    if (this.GoalId !== undefined) result.GoalId = this.GoalId;

    return result;
  }
}
