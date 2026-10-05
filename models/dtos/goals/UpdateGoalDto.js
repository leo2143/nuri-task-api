import { z } from 'zod';
import { CreateGoalDto } from './CreateGoalDto.js';
import {
  dueDateNotPastField,
  goalStatusField,
  optionalDescriptionField,
  priorityField,
  titleField,
  validateZod,
} from '../zodHelpers.js';

/**
 * DTO para actualizar una meta existente
 */
export class UpdateGoalDto extends CreateGoalDto {
  static schema = z.object({
    title: titleField,
    description: optionalDescriptionField,
    reason: z
      .string({ invalid_type_error: 'La razón de importancia debe ser un string válido' })
      .max(50, 'La razón de importancia no puede superar los 50 caracteres')
      .optional(),
    status: goalStatusField.optional(),
    priority: priorityField.optional(),
    dueDate: dueDateNotPastField(),
    parentGoalId: z.string().nullable().optional(),
  });

  constructor(data) {
    super({});
    this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.reason !== undefined) this.reason = data.reason;
    if (data.status !== undefined) this.status = data.status;
    if (data.priority !== undefined) this.priority = data.priority;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate;
    if (data.parentGoalId !== undefined) this.parentGoalId = data.parentGoalId;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      title: this.title,
      description: this.description,
      reason: this.reason,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      parentGoalId: this.parentGoalId,
    });
  }

  toPlainObject() {
    const result = {};

    if (this.title !== undefined) result.title = this.title.trim();
    if (this.description !== undefined) result.description = this.description.trim();
    if (this.reason !== undefined) result.reason = this.reason.trim();
    if (this.status !== undefined) result.status = this.status;
    if (this.priority !== undefined) result.priority = this.priority;
    if (this.dueDate !== undefined) result.dueDate = this.dueDate;
    if (this.parentGoalId !== undefined) result.parentGoalId = this.parentGoalId;

    return result;
  }
}
