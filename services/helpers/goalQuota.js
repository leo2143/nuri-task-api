import Goal from '../../models/goalsModel.js';
import User from '../../models/userModel.js';
import { hasPremiumAccess, PREMIUM_ACCESS_USER_SELECT } from './premiumAccess.js';

/** Máximo de metas (de cualquier estado, subetas incluidas) del plan gratuito. */
export const FREE_GOALS_LIMIT = 6;

/**
 * Cupo de metas de un usuario. Es la única regla de límite: la usan `createGoal` (403) y `GET /api/goals/quota`.
 * @param {string} userId - ID del usuario
 * @returns {Promise<{limit: number|null, used: number, canCreate: boolean}>} `limit` es null si el acceso es Premium
 */
export async function getGoalQuota(userId) {
  const [user, used] = await Promise.all([
    User.findById(userId).select(PREMIUM_ACCESS_USER_SELECT).lean(),
    Goal.countDocuments({ userId }),
  ]);

  if (hasPremiumAccess(user)) return { limit: null, used, canCreate: true };
  return { limit: FREE_GOALS_LIMIT, used, canCreate: used < FREE_GOALS_LIMIT };
}
