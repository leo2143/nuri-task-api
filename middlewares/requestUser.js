import User from '../models/userModel.js';

const USER_DOC_SELECT = 'subscription isAdmin';

/**
 * Devuelve el usuario de Mongo para este request (isAdmin + subscription).
 * Cachea en req.userDoc para no repetir el findById en el mismo ciclo.
 * @param {Object} req
 * @returns {Promise<Object|null>}
 */
export async function getRequestUser(req) {
  if (req.userDoc !== undefined) {
    return req.userDoc;
  }

  const user = await User.findById(req.userId).select(USER_DOC_SELECT).lean();
  req.userDoc = user ?? null;
  return req.userDoc;
}
