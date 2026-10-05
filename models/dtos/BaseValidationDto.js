import { z } from 'zod';
import {
  dueDateNotPastField,
  goalStatusField,
  optionalTitleField,
  priorityField,
  validateZod,
} from './zodHelpers.js';

/**
 * DTO base con title / priority / dueDate / status.
 */
export class BaseValidationDto {
  static schema = z.object({
    title: optionalTitleField,
    priority: priorityField.optional(),
    dueDate: dueDateNotPastField(),
    status: goalStatusField.optional(),
  });

  constructor(data = {}) {
    this.title = data.title;
    this.priority = data.priority;
    this.dueDate = data.dueDate || null;
    this.status = data.status;
  }

  validate() {
    return validateZod(this.constructor.schema, {
      title: this.title,
      priority: this.priority,
      dueDate: this.dueDate,
      status: this.status,
    });
  }

  toPlainObject() {
    const result = {};
    if (this.title !== undefined) result.title = this.title?.trim();
    if (this.priority !== undefined) result.priority = this.priority;
    if (this.dueDate !== undefined) result.dueDate = this.dueDate;
    if (this.status !== undefined) result.status = this.status;
    return result;
  }
}
