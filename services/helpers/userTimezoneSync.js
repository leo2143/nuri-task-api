import chalk from 'chalk';
import User from '../../models/userModel.js';
import { canonicalTimeZone } from './dateTime.js';

/**
 * Re-sincroniza la zona horaria guardada con la que mandó el dispositivo.
 * No hace nada si no hay zona entrante o si ambas tienen la misma clave canónica
 * (dos grafías de una misma zona no cuentan como cambio). Guarda siempre la clave canónica,
 * nunca el valor crudo recibido.
 * @param {{_id: *, timezone?: string|null}} user - Documento del usuario; se actualiza en memoria si hubo cambio
 * @param {string|undefined} incomingTimezone - Zona entrante (el DTO ya la validó, pero acá se vuelve a validar)
 * @returns {Promise<boolean>} true si se escribió una zona nueva
 */
export async function syncUserTimezone(user, incomingTimezone) {
  const incomingKey = canonicalTimeZone(incomingTimezone);
  if (!incomingKey || canonicalTimeZone(user.timezone) === incomingKey) {
    return false;
  }

  await User.updateOne({ _id: user._id }, { $set: { timezone: incomingKey } });
  user.timezone = incomingKey;
  return true;
}

/**
 * Variante para flujos de autenticación: la zona es un dato accesorio, así que un fallo de escritura
 * se registra y nunca hace fallar el login ni la verificación.
 * @param {{_id: *, timezone?: string|null}} user
 * @param {string|undefined} incomingTimezone
 * @returns {Promise<boolean>} true si se escribió una zona nueva, false si no hubo cambio o falló
 */
export async function syncUserTimezoneBestEffort(user, incomingTimezone) {
  try {
    return await syncUserTimezone(user, incomingTimezone);
  } catch (error) {
    console.error(chalk.yellow('No se pudo sincronizar la zona horaria del usuario:'), error);
    return false;
  }
}
