import Goal from '../../models/goalsModel.js';
import { NotFoundResponseModel } from '../../models/responseModel.js';

/**
 * Busca una meta que pertenezca al usuario.
 * @returns {{ goal: Object|null, error: NotFoundResponseModel|null }}
 */
export async function findOwnedGoal(goalId, userId) {
  if (!goalId) {
    return { goal: null, error: null };
  }

  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) {
    return { goal: null, error: new NotFoundResponseModel('Meta no encontrada') };
  }

  return { goal, error: null };
}
