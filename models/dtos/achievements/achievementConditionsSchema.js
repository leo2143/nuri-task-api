import { z } from 'zod';
import { buildDisallowedConditionsMessage, getDisallowedConditionKeys } from '../../achievementCatalog.js';

// Un año: más allá deja de ser un límite útil y un valor enorme llegaría al evaluador como Infinity
const MAX_DURATION_HOURS_CAP = 8760;

const hourMinuteField = z
  .string({ required_error: 'La hora es requerida', invalid_type_error: 'La hora debe tener formato HH:mm' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener formato HH:mm');

const timeWindowSchema = z
  .object({ start: hourMinuteField, end: hourMinuteField })
  .strict()
  .refine(
    timeWindow => timeWindow.start !== timeWindow.end,
    'La franja horaria no puede empezar y terminar a la misma hora'
  );

/**
 * Forma de `conditions` en los DTOs de logros. `sameWindow` es un booleano explícito (sin coerción desde strings).
 * Qué condiciones admite cada evento se valida aparte con `refineConditionsForTrigger`.
 */
export const achievementConditionsSchema = z
  .object({
    timeWindow: timeWindowSchema.optional(),
    sameWindow: z.boolean({ invalid_type_error: 'sameWindow debe ser true o false' }).optional(),
    maxDurationHours: z
      .number({ invalid_type_error: 'maxDurationHours debe ser un número' })
      .finite('maxDurationHours debe ser un número finito')
      .positive('maxDurationHours debe ser mayor a 0')
      .max(MAX_DURATION_HOURS_CAP, `maxDurationHours no puede superar ${MAX_DURATION_HOURS_CAP} horas`)
      .optional(),
  })
  .strict();

/**
 * Agrega al esquema de un logro el chequeo "las condiciones están permitidas para el evento".
 * Solo corre cuando el DTO trae ambos datos: en una actualización parcial el servicio valida contra el logro guardado.
 * @param {import('zod').ZodObject} objectSchema - Esquema con `triggerEvent` y `conditions`
 * @returns {import('zod').ZodEffects}
 */
export function refineConditionsForTrigger(objectSchema) {
  return objectSchema.superRefine((data, context) => {
    if (!data.triggerEvent || !data.conditions) return;

    const disallowedKeys = getDisallowedConditionKeys(data.triggerEvent, data.conditions);
    if (disallowedKeys.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conditions'],
        message: buildDisallowedConditionsMessage(data.triggerEvent, disallowedKeys),
      });
    }
  });
}
