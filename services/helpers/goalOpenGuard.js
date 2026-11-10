import Goal from '../../models/goalsModel.js';
import { ConflictResponseModel } from '../../models/responseModel.js';

export const COMPLETED_GOAL_CONFLICT_MESSAGE =
  'Esta meta ya está completada. Reabrila desde su detalle para sumarle tareas o submetas. Si no ves el botón, actualizá la app.';

/**
 * Guarda de solo lectura para metas completadas.
 * Una meta completada no admite tareas ni submetas nuevas hasta que se la reabre de forma explícita.
 * Debe correr ANTES de cualquier escritura en el sitio que la llama.
 * @param {string|import('mongoose').Types.ObjectId|null|undefined} goalId - Meta a verificar (sin id no hay nada que verificar)
 * @param {string} userId - ID del dueño de la meta
 * @returns {Promise<ConflictResponseModel|null>} 409 si la meta está completada, null si se puede escribir
 */
export async function assertGoalOpen(goalId, userId) {
  if (!goalId) return null;

  const completedGoal = await Goal.exists({ _id: goalId, userId, status: 'completed' });
  return completedGoal ? new ConflictResponseModel(COMPLETED_GOAL_CONFLICT_MESSAGE) : null;
}
