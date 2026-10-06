import { z } from 'zod';
import mongoose from 'mongoose';
import { ValidationHelpers } from '../../services/helpers/validationHelpers.js';

/**
 * Corre un schema Zod y lo adapta a { isValid, errors }.
 * @param {import('zod').ZodTypeAny} schema
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[], data: Object|null }}
 */
export function mergeValidations(...results) {
  const errors = results.flatMap(result => result.errors);
  return { isValid: errors.length === 0, errors };
}

export const optionalDateField = z
  .union([z.date(), z.string()])
  .optional()
  .refine(value => !value || !Number.isNaN(new Date(value).getTime()), 'Debe ser una fecha válida');

export function validateZod(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { isValid: true, errors: [], data: result.data };
  }
  return {
    isValid: false,
    errors: result.error.issues.map(issue => issue.message),
    data: null,
  };
}

export const emailField = z
  .string({ required_error: 'El email es requerido', invalid_type_error: 'El email es requerido' })
  .min(1, 'El email es requerido')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido');

export const passwordField = z
  .string({ required_error: 'La contraseña es requerida', invalid_type_error: 'La contraseña es requerida' })
  .min(1, 'La contraseña es requerida')
  .min(6, 'La contraseña debe tener al menos 6 caracteres');

export const loginPasswordField = z
  .string({ required_error: 'La contraseña es requerida', invalid_type_error: 'La contraseña es requerida' })
  .min(1, 'La contraseña es requerida');

export const tokenField = z
  .string({ required_error: 'Token requerido', invalid_type_error: 'Token requerido' })
  .trim()
  .min(1, 'Token requerido');

export const objectIdField = z
  .string({ required_error: 'ID inválido', invalid_type_error: 'ID inválido' })
  .refine(value => mongoose.Types.ObjectId.isValid(value), 'Debe ser un ID válido');

/** Query/body boolean. No usar z.coerce.boolean() ("false" sería true). */
export const queryBooleanField = z.union([z.boolean(), z.literal('true'), z.literal('false')], {
  errorMap: () => ({ message: 'Debe ser un valor booleano' }),
});

export const queryNumberField = z.union([
  z.number({ invalid_type_error: 'Debe ser un número' }),
  z
    .string()
    .min(1, 'Debe ser un número')
    .refine(value => !Number.isNaN(Number(value)), 'Debe ser un número')
    .transform(value => Number(value)),
]);

export const priorityField = z.enum(['low', 'medium', 'high'], {
  errorMap: () => ({ message: 'La prioridad debe ser una de: low, medium, high' }),
});

export const goalStatusField = z.enum(['active', 'paused', 'completed'], {
  errorMap: () => ({ message: 'El estado debe ser uno de: active, paused, completed' }),
});

export const sortOrderField = z.enum(['asc', 'desc'], {
  errorMap: () => ({ message: 'sortOrder debe ser uno de: asc, desc' }),
});

export const titleField = z
  .string({ required_error: 'El título es requerido y debe ser un string válido' })
  .trim()
  .min(3, 'El título debe tener al menos 3 caracteres')
  .max(50, 'El título no puede superar los 50 caracteres');

export const optionalTitleField = z
  .string({ invalid_type_error: 'El título debe ser un string válido' })
  .trim()
  .min(3, 'El título debe tener al menos 3 caracteres')
  .max(50, 'El título no puede superar los 50 caracteres')
  .optional();

export const optionalDescriptionField = z
  .string({ invalid_type_error: 'La descripción debe ser un string válido' })
  .max(100, 'La descripción no puede superar los 100 caracteres')
  .optional();

export function dueDateNotPastField(message = 'La fecha límite no puede ser anterior al día actual') {
  return z
    .union([z.date(), z.string(), z.null()])
    .optional()
    .refine(value => {
      if (value === undefined || value === null || value === '') return true;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(date);
      due.setHours(0, 0, 0, 0);
      return due >= today;
    }, { message });
}

export function imageUrlField(required = true, fieldName = 'La URL de la imagen') {
  return z
    .string({
      required_error: `${fieldName} es requerida y debe ser un string válido`,
      invalid_type_error: `${fieldName} debe ser un string válido`,
    })
    .superRefine((value, ctx) => {
      const error = ValidationHelpers.validateImageUrl(value, required, fieldName);
      if (error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
      }
    });
}

export function cloudinaryImageUrlField(fieldName = 'La URL de la imagen') {
  return z.string().superRefine((value, ctx) => {
    const error = ValidationHelpers.validateCloudinaryImageUrl(value, true, fieldName);
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }
  });
}

export const paginationSchema = z.object({
  cursor: z
    .string()
    .optional()
    .nullable()
    .refine(value => !value || mongoose.Types.ObjectId.isValid(value), 'El cursor debe ser un ID válido'),
  limit: z
    .number({ invalid_type_error: 'El límite debe estar entre 1 y 100' })
    .min(1, 'El límite debe estar entre 1 y 100')
    .max(100, 'El límite debe estar entre 1 y 100'),
});
