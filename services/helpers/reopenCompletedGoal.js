import Goal from '../../models/goalsModel.js';

/**
 * Reabre una meta completed a active sin descontar métricas.
 * Sella firstCompletedAt si faltaba (metas cerradas antes de este campo).
 * Si el padre también estaba completed, lo reabre (submeta reactivada).
 * @param {string|import('mongoose').Types.ObjectId|null} goalId
 * @param {string} userId
 * @param {Set<string>} [visited] - Evita ciclos en la cadena de padres
 * @returns {Promise<boolean>} true si reabrió esta meta
 */
export async function reopenCompletedGoal(goalId, userId, visited = new Set()) {
  if (!goalId) return false;

  const id = goalId.toString();
  if (visited.has(id)) return false;
  visited.add(id);

  const goal = await Goal.findOne({ _id: goalId, userId, status: 'completed' });
  if (!goal) return false;

  if (!goal.firstCompletedAt) {
    goal.firstCompletedAt = new Date();
  }
  goal.status = 'active';
  await goal.save();

  if (!goal.parentGoalId) return true;

  const parent = await Goal.findOne({ _id: goal.parentGoalId, userId });
  if (parent) {
    await parent.updateSubGoalCount();
    await parent.save();
  }

  await reopenCompletedGoal(goal.parentGoalId, userId, visited);
  return true;
}
