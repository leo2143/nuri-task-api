import { z } from 'zod';
import { canonicalTimeZone } from '../../../services/helpers/dateTime.js';
import { validateZod } from '../zodHelpers.js';

/**
 * Body de PUT /api/user/timezone ({ timezone }).
 * Falta el campo o no es un string => 400. Un string que no es una zona IANA válida NO falla:
 * se descarta (`timezone` queda `undefined` en toPlainObject) y el servicio responde sin cambios.
 */
export class UpdateTimezoneDto {
  static schema = z.object({
    timezone: z
      .string({
        required_error: 'La zona horaria es requerida',
        invalid_type_error: 'La zona horaria debe ser un texto',
      })
      .trim()
      .min(1, 'La zona horaria es requerida'),
  });

  constructor(data = {}) {
    this.timezone = data.timezone;
  }

  validate() {
    return validateZod(this.constructor.schema, { timezone: this.timezone });
  }

  /**
   * @returns {{timezone: string|undefined}} La forma que resuelve `Intl`, o `undefined` si la zona no es válida
   */
  toPlainObject() {
    return {
      timezone: canonicalTimeZone(this.timezone) ?? undefined,
    };
  }
}
