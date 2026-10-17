import Goal from '../../models/goalsModel.js';

/**
 * Marca lastChildActivity en la meta y burbujea a los ancestros.
 */
export async function touchLastChildActivity(goalId, userId) {
  if (!goalId || !userId) {
    return;
  }

  const now = new Date();
  let currentId = goalId;
  const seen = new Set();

  while (currentId && !seen.has(String(currentId))) {
    seen.add(String(currentId));
    const goal = await Goal.findOneAndUpdate(
      { _id: currentId, userId, deleted_at: null },
      { $set: { lastChildActivity: now } },
      { new: true, projection: { parentGoalId: 1 } }
    );

    if (!goal?.parentGoalId) {
      break;
    }

    currentId = goal.parentGoalId;
  }
}

/**
 * Campos pausedAt según transición de estado.
 */
export function pausedAtFieldsForStatus(currentStatus, nextStatus) {
  if (!nextStatus || nextStatus === currentStatus) {
    return {};
  }

  if (nextStatus === 'paused') {
    return { pausedAt: new Date() };
  }

  return { pausedAt: null };
}
