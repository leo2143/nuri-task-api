/**
 * Transiciones de status de meta. Completar no se deriva del progreso.
 */

export const COMPLETED_GOAL_STATUS_MESSAGE =
  'Esta meta ya está completada. Si querés retomarla, reabrila desde su detalle.';

/**
 * Indica si el cambio de status es una reapertura (completed -> active).
 * Esa transición solo se resuelve delegando en GoalService.reopenGoal, nunca con una escritura directa del campo.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
export function isReopenTransition(currentStatus, nextStatus) {
  return currentStatus === 'completed' && nextStatus === 'active';
}

/**
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {string|null} Mensaje de error o null si la transición es válida
 */
export function getStatusTransitionError(currentStatus, nextStatus) {
  if (!nextStatus || currentStatus === nextStatus) return null;

  if (isReopenTransition(currentStatus, nextStatus)) return null;

  if (currentStatus === 'completed') {
    return COMPLETED_GOAL_STATUS_MESSAGE;
  }

  if (nextStatus === 'completed' && currentStatus === 'paused') {
    return 'Reanudá la meta antes de cerrarla';
  }

  return null;
}

/**
 * Cerrar exige al menos un hijo y que todas las tareas y submetas estén hechas.
 * @param {{ totalTasks?: number, completedTasks?: number, totalSubGoals?: number, completedSubGoals?: number }} goal
 * @returns {string|null}
 */
export function getCompleteEligibilityError(goal) {
  const totalTasks = goal.totalTasks || 0;
  const totalSubGoals = goal.totalSubGoals || 0;
  const totalChildren = totalTasks + totalSubGoals;

  if (totalChildren === 0) {
    return 'No se puede cerrar una meta vacía. Agregá al menos una tarea o submeta.';
  }

  const allTasksDone = (goal.completedTasks || 0) === totalTasks;
  const allSubGoalsDone = (goal.completedSubGoals || 0) === totalSubGoals;
  if (!allTasksDone || !allSubGoalsDone) {
    return 'No se puede cerrar la meta: hay tareas o submetas pendientes.';
  }

  return null;
}
