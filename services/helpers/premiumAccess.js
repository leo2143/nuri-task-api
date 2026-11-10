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

/**
 * Qué logros activos ve un usuario: los premium solo con acceso Premium. Un usuario free no los cuenta en ningún total;
 * `premiumLocked` (cuántos hay) alimenta la línea de invitación a Premium del cliente.
 * @param {Array<{tier: string}>} activeAchievements - Logros activos
 * @param {boolean} isPremium
 * @returns {{visibleAchievements: Array, premiumLocked: number}} `premiumLocked` es 0 para un usuario Premium
 */
export function partitionByPremiumVisibility(activeAchievements, isPremium) {
  if (isPremium) return { visibleAchievements: activeAchievements, premiumLocked: 0 };

  const visibleAchievements = activeAchievements.filter(achievement => achievement.tier === 'basic');
  return { visibleAchievements, premiumLocked: activeAchievements.length - visibleAchievements.length };
}
