import User from '../../models/userModel.js';
import { canonicalTimeZone } from './dateTime.js';

/**
 * Re-sincroniza la zona horaria guardada con la que mandó el dispositivo.
 * No hace nada si no hay zona entrante o si ambas tienen la misma clave canónica
 * (dos grafías de una misma zona no cuentan como cambio).
 * @param {{_id: *, timezone?: string|null}} user - Documento del usuario; se actualiza en memoria si hubo cambio
 * @param {string|undefined} incomingTimezone - Zona ya validada por el DTO (forma resuelta por Intl)
 * @returns {Promise<boolean>} true si se escribió una zona nueva
 */
export async function syncUserTimezone(user, incomingTimezone) {
  const incomingKey = canonicalTimeZone(incomingTimezone);
  if (!incomingKey || canonicalTimeZone(user.timezone) === incomingKey) {
    return false;
  }

  await User.updateOne({ _id: user._id }, { $set: { timezone: incomingTimezone } });
  user.timezone = incomingTimezone;
  return true;
}
