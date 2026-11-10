import { getRequestUser } from '../../middlewares/requestUser.js';
import { getTodayYmd } from '../../services/helpers/dueDateRules.js';

/**
 * "Hoy" (YYYY-MM-DD) en la zona horaria del usuario autenticado, para validar fechas límite.
 * Un usuario sin zona guardada usa la zona de producto.
 * @param {Object} req - Request de Express ya autenticado
 * @returns {Promise<string>}
 */
export async function getRequestTodayYmd(req) {
  const user = await getRequestUser(req);
  return getTodayYmd(user?.timezone);
}
