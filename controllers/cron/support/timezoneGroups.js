import User from '../../../models/userModel.js';
import { DEFAULT_TIMEZONE, canonicalTimeZone } from '../../../services/helpers/dateTime.js';

/**
 * Clave de grupo de la zona de producto (ART). `Intl` puede resolverla con otra grafía que `DEFAULT_TIMEZONE`
 * (depende del ICU del runtime), por eso la clave se calcula y no se escribe a mano.
 */
export const PRODUCT_TIMEZONE_KEY = canonicalTimeZone(DEFAULT_TIMEZONE) ?? DEFAULT_TIMEZONE;

/**
 * @typedef {Object} TimezoneGroup
 * @property {string} key - Clave canónica de la zona (sirve para agrupar e identificar, nunca como valor de consulta)
 * @property {string[]} spellings - Todas las grafías guardadas en usuarios que resuelven a esta zona
 * @property {boolean} includesMissing - true si el grupo también toma a los usuarios sin zona (grupo de producto)
 */

/**
 * Agrupa los usuarios por zona. Dos grafías de una misma zona (`Asia/Kolkata` y `Asia/Calcutta`) forman un solo
 * grupo, y la consulta de usuarios usa TODAS las grafías guardadas: así nadie queda afuera por el alias que
 * resolvió su dispositivo. Los usuarios sin zona y los valores que `Intl` rechaza caen en el grupo de producto,
 * un dato corrupto nunca aborta la corrida.
 * @returns {Promise<Map<string, TimezoneGroup>>} clave de zona -> grupo (el de producto siempre existe)
 */
export async function fetchTimezoneGroups() {
  const groups = new Map();
  groups.set(PRODUCT_TIMEZONE_KEY, {
    key: PRODUCT_TIMEZONE_KEY,
    spellings: [DEFAULT_TIMEZONE],
    includesMissing: true,
  });

  const storedValues = await User.distinct('timezone');
  for (const stored of storedValues) {
    // Los usuarios sin zona los cubre `includesMissing` del grupo de producto
    if (stored === null || stored === undefined) continue;

    let key = canonicalTimeZone(stored);
    if (key === null) {
      console.warn(`[Cron] Zona horaria inválida guardada en usuarios (${JSON.stringify(stored)}): se agrupa con la zona de producto`);
      key = PRODUCT_TIMEZONE_KEY;
    }

    if (!groups.has(key)) {
      groups.set(key, { key, spellings: [], includesMissing: false });
    }
    const group = groups.get(key);
    if (!group.spellings.includes(stored)) group.spellings.push(stored);
  }

  return groups;
}

/**
 * Filtro de usuarios de un grupo: cualquiera de sus grafías y, en el grupo de producto, los usuarios sin zona.
 * @param {TimezoneGroup} group
 * @returns {Object}
 */
export function buildGroupUserFilter(group) {
  const bySpelling = { timezone: { $in: group.spellings } };
  return group.includesMissing ? { $or: [bySpelling, { timezone: null }] } : bySpelling;
}
