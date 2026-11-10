import Goal from '../../models/goalsModel.js';

export const MAX_GOAL_DEPTH = 20;

/**
 * Junta los IDs de todos los descendientes de una meta (hijos, nietos, ...), nivel por nivel.
 * Usa un set de visitados y el mismo tope de profundidad que la cadena de ancestros, así un ciclo corrupto termina.
 * Toda lectura está acotada por userId.
 * @param {string|import('mongoose').Types.ObjectId} goalId - Meta de la que se parte (no se incluye en el resultado)
 * @param {string} userId - ID del dueño de las metas
 * @returns {Promise<string[]>} IDs de los descendientes
 */
export async function getDescendantIds(goalId, userId) {
  const visited = new Set([goalId.toString()]);
  const descendantIds = [];
  let frontier = [goalId];

  for (let depth = 0; depth < MAX_GOAL_DEPTH && frontier.length > 0; depth++) {
    const children = await Goal.find({ parentGoalId: { $in: frontier }, userId })
      .select('_id')
      .lean();

    frontier = [];
    for (const child of children) {
      const childId = child._id.toString();
      if (visited.has(childId)) continue;
      visited.add(childId);
      descendantIds.push(childId);
      frontier.push(child._id);
    }
  }

  return descendantIds;
}

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

export const GOAL_CYCLE_MESSAGE = 'No se pueden vincular estas metas: una ya forma parte de la otra.';

/**
 * Indica si colgar una meta debajo de otra crearía un ciclo:
 * la meta destino es la propia meta o uno de sus descendientes (la meta es ancestro del destino).
 * @param {string|import('mongoose').Types.ObjectId} goalId - Meta que se quiere mover
 * @param {string|import('mongoose').Types.ObjectId} newParentId - Meta bajo la que se quiere colgar
 * @param {string} userId - ID del dueño de las metas
 * @returns {Promise<boolean>} true si la vinculación formaría un ciclo
 */
export async function wouldCreateGoalCycle(goalId, newParentId, userId) {
  if (goalId.toString() === newParentId.toString()) return true;

  const newParentAncestors = await getAncestorChain(newParentId, userId);
  return newParentAncestors.some(ancestor => ancestor._id.toString() === goalId.toString());
}
