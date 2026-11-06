import Goal from '../../models/goalsModel.js';

export const MAX_GOAL_DEPTH = 20;

/**
 * Recorre la cadena de ancestros de una meta, del padre directo hacia arriba.
 * Usa un set de visitados y un tope de profundidad, así un ciclo corrupto en los datos termina.
 * Toda lectura está acotada por userId.
 * @param {string|import('mongoose').Types.ObjectId} goalId - Meta de la que se parte (no se incluye en el resultado)
 * @param {string} userId - ID del dueño de las metas
 * @returns {Promise<Array<{_id: import('mongoose').Types.ObjectId, parentGoalId: import('mongoose').Types.ObjectId|null, status: string, firstCompletedAt: Date|null}>>}
 *   Ancestros ordenados del más cercano al más lejano
 */
export async function getAncestorChain(goalId, userId) {
  const visited = new Set([goalId.toString()]);
  const ancestors = [];

  let current = await Goal.findOne({ _id: goalId, userId }).select('parentGoalId').lean();

  while (current?.parentGoalId && ancestors.length < MAX_GOAL_DEPTH) {
    const parentId = current.parentGoalId.toString();
    if (visited.has(parentId)) break;
    visited.add(parentId);

    const parent = await Goal.findOne({ _id: parentId, userId }).select('parentGoalId status firstCompletedAt').lean();
    if (!parent) break;

    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
}
