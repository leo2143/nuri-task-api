import { z } from 'zod';
import { validateZod } from '../zodHelpers.js';

/**
 * DTO para agregar un comentario a una tarea.
 * El author lo completa el service desde el usuario autenticado.
 */
export class AddCommentDto {
  static schema = z.object({
    text: z
      .string({ required_error: 'El texto del comentario es requerido y debe ser un string válido' })
      .trim()
      .min(3, 'El texto del comentario debe tener al menos 3 caracteres')
      .max(500, 'El texto del comentario no puede superar los 500 caracteres'),
    date: z
      .union([z.date(), z.string()])
      .optional()
      .refine(value => !value || !Number.isNaN(new Date(value).getTime()), 'La fecha del comentario debe ser una fecha válida'),
  });

  constructor(data = {}) {
    this.text = data.text;
    this.date = data.date || new Date();
  }

  validate() {
    return validateZod(this.constructor.schema, { text: this.text, date: this.date });
  }

  toPlainObject() {
    return {
      text: this.text.trim(),
      date: this.date,
    };
  }
}
