/**
 * Acceso Premium de un usuario: es premium quien es admin o tiene la suscripción activa.
 * Los lectores de logros y los jobs de completado usan esta misma regla.
 */

/** Campos del usuario que hacen falta para decidir el acceso Premium. */
export const PREMIUM_ACCESS_USER_SELECT = 'subscription isAdmin';

/**
 * @param {{isAdmin?: boolean, subscription?: {isActive?: boolean}}|null|undefined} user - Documento (o lean) con los
 *   campos de `PREMIUM_ACCESS_USER_SELECT`
 * @returns {boolean}
 */
export function hasPremiumAccess(user) {
  return Boolean(user?.isAdmin || user?.subscription?.isActive);
}
