import UserAchievement from '../models/userAchievementModel.js';
import Achievement from '../models/achievementModel.js';
import User from '../models/userModel.js';
import { NotFoundResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel } from '../models/responseModel.js';
import { PaginationDto } from '../models/dtos/paginationDto.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { persistAndNotify } from './helpers/persistAndNotify.js';
import { evaluateAchievementConditions, conditionsNeedTimezone, getCurrentWindowKey } from './achievementConditions.js';
import {
  buildAbsoluteProgressPipeline,
  buildIncrementProgressPipeline,
  buildWindowProgressPipeline,
} from './helpers/achievementProgressPipeline.js';
import { resolveTimeZone } from './helpers/dateTime.js';
import {
  PREMIUM_ACCESS_USER_SELECT,
  hasPremiumAccess,
  partitionByPremiumVisibility,
  toLockedAchievementView,
} from './helpers/premiumAccess.js';
import mongoose from 'mongoose';
import chalk from 'chalk';

const POPULATE_USER_FIELDS = 'name email avatar';
// Completar a todos los usuarios tras bajar un objetivo corre dentro del PUT del admin (Vercel: maxDuration = 60 s):
// se hace por tandas y con un presupuesto de tiempo; lo que no alcanza se completa con el próximo evento del usuario.
const COMPLETION_BATCH_SIZE = 200;
const COMPLETION_TIME_BUDGET_MS = 40_000;
const COMPLETION_CONCURRENCY = 10;
// Un resumen reclamado y no confirmado se puede reclamar de nuevo pasado este lease (la función murió a mitad de camino)
const PREMIUM_SUMMARY_LEASE_MS = 2 * 60 * 1000;
const DEFAULT_PROGRESS = {
  currentCount: 0,
  status: 'locked',
  unlockedAt: null,
  completedAt: null,
};

/**
 * Corre `task` sobre cada elemento con a lo sumo `limit` ejecuciones en paralelo (sin dependencias nuevas).
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} task
 * @returns {Promise<R[]>} Resultados en el mismo orden que `items`
 */
async function mapWithConcurrency(items, limit, task) {
  const results = [];
  for (let start = 0; start < items.length; start += limit) {
    results.push(...(await Promise.all(items.slice(start, start + limit).map(task))));
  }
  return results;
}

/**
 * Servicio para gestionar el progreso del usuario en logros
 */
export class UserAchievementService {
  /**
   * Obtiene todos los logros con el progreso del usuario.
   * Un usuario sin acceso Premium recibe los logros premium bloqueados (`isAccessible: false`, progreso por defecto) y
   * sin título, descripción ni reglas: solo `_id`, `tier`, `imageUrl` e `isActive`.
   * @param {string} userId - ID del usuario
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con los logros y el progreso del usuario
   */
  static async getAllAchievementsWithProgress(userId, pagination = {}) {
    try {
      const paginationDto = new PaginationDto({
        ...pagination,
        limit: pagination.limit || 100,
      });

      const user = await User.findById(userId).select(PREMIUM_ACCESS_USER_SELECT).lean();
      const isPremium = hasPremiumAccess(user);

      const query = { isActive: true };
      paginationDto.applyCursorToQuery(query);

      const achievements = await Achievement.find(query)
        .sort(paginationDto.toMongoSort())
        .limit(paginationDto.limit + 1)
        .lean();

      const { results: paginatedAchievements, meta } = paginationDto.processPaginationResults(achievements);

      // Solo busco progreso para los logros que el usuario puede desbloquear
      const accessibleAchievementIds = paginatedAchievements
        .filter(achievement => isPremium || achievement.tier === 'basic')
        .map(achievement => achievement._id);

      const userProgressRecords = await UserAchievement.find({
        user: userId,
        achievement: { $in: accessibleAchievementIds },
      }).lean();

      const userProgressByAchievementId = new Map(
        userProgressRecords.map(progressRecord => [progressRecord.achievement.toString(), progressRecord])
      );

      const achievementsWithProgress = paginatedAchievements.map(achievement => {
        const isAccessible = isPremium || achievement.tier === 'basic';
        return {
          ...(isAccessible ? achievement : toLockedAchievementView(achievement)),
          isAccessible,
          userProgress: isAccessible
            ? userProgressByAchievementId.get(achievement._id.toString()) || DEFAULT_PROGRESS
            : DEFAULT_PROGRESS,
        };
      });

      return new SuccessResponseModel(achievementsWithProgress, 'Logros obtenidos correctamente', 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener logros con progreso');
    }
  }

  /**
   * Obtiene el progreso del usuario en un logro específico.
   * Un usuario sin acceso Premium ve un logro premium con el progreso por defecto, sin importar lo que haya guardado
   * (progreso o finalización silenciosa): la puerta de acceso vive acá y no depende del middleware de la ruta.
   * En ese caso el logro viaja sin título, descripción ni reglas (solo `_id`, `tier`, `imageUrl` e `isActive`).
   * @param {string} userId - ID del usuario
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el progreso del usuario
   * Incluye populate de userId (User) y achievementId (Achievement)
   */
  static async getUserAchievementProgress(userId, achievementId) {
    try {
      const achievementData = await Achievement.findById(achievementId);
      if (!achievementData) {
        return new NotFoundResponseModel('Logro no encontrado');
      }

      if (achievementData.tier === 'premium') {
        const user = await User.findById(userId).select(PREMIUM_ACCESS_USER_SELECT).lean();
        if (!hasPremiumAccess(user)) {
          return new SuccessResponseModel(
            { achievement: toLockedAchievementView(achievementData.toObject()), ...DEFAULT_PROGRESS },
            'Progreso de logro obtenido correctamente'
          );
        }
      }

      const userAchievement = await UserAchievement.findOne({ user: userId, achievement: achievementId })
        .populate('user', POPULATE_USER_FIELDS)
        .populate('achievement');

      if (!userAchievement) {
        // Si no existe progreso, devolver valores por defecto
        return new SuccessResponseModel(
          {
            achievement: achievementData,
            ...DEFAULT_PROGRESS,
          },
          'Progreso de logro obtenido correctamente'
        );
      }

      return new SuccessResponseModel(userAchievement, 'Progreso de logro obtenido correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener progreso de logro');
    }
  }

  /**
   * Obtiene estadísticas de logros del usuario.
   * Un usuario sin acceso Premium cuenta solo los logros básicos activos (`total`, `notStarted` y la tasa); `premiumLocked`
   * es cuántos logros premium activos hay (0 para un usuario Premium, que los tiene todos en `total`).
   * Los logros inactivos no cuentan: ni en el total ni en el progreso.
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>}
   */
  static async getUserStats(userId) {
    try {
      const user = await User.findById(userId).select(PREMIUM_ACCESS_USER_SELECT).lean();
      const activeAchievements = await Achievement.find({ isActive: true }).select('_id tier').lean();
      const { visibleAchievements, premiumLocked } = partitionByPremiumVisibility(
        activeAchievements,
        hasPremiumAccess(user)
      );

      const totalAchievements = visibleAchievements.length;
      const userProgress =
        totalAchievements === 0
          ? []
          : await UserAchievement.find({
              user: userId,
              achievement: { $in: visibleAchievements.map(achievement => achievement._id) },
            })
              .select('status')
              .lean();

      const statusCounts = userProgress.reduce(
        (acc, progress) => {
          acc[progress.status] = (acc[progress.status] || 0) + 1;
          return acc;
        },
        { locked: 0, unlocked: 0, completed: 0 }
      );

      const notStarted = totalAchievements - userProgress.length;

      const stats = {
        total: totalAchievements,
        notStarted,
        locked: statusCounts.locked,
        unlocked: statusCounts.unlocked,
        completed: statusCounts.completed,
        premiumLocked,
        completionRate: totalAchievements > 0 ? ((statusCounts.completed / totalAchievements) * 100).toFixed(2) : 0,
      };

      return new SuccessResponseModel(stats, 'Estadísticas de logros obtenidas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener estadísticas de logros');
    }
  }

  /**
   * Resetea el progreso del usuario en un logro (solo administradores)
   * @param {string} userId - ID del usuario
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la confirmación de eliminación
   */
  static async resetProgress(userId, achievementId) {
    try {
      const userAchievement = await UserAchievement.findOneAndDelete({ user: userId, achievement: achievementId });

      if (!userAchievement) {
        return new NotFoundResponseModel('No se encontró progreso para este logro');
      }

      return new SuccessResponseModel(userAchievement, 'Progreso reseteado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'resetear progreso');
    }
  }

  /**
   * Procesa un evento de usuario y actualiza el progreso en todos los logros que lo escuchan.
   * Se llama desde otros servicios (todoService, goalService, metricsService) sin interrumpir
   * el flujo principal: los errores aquí nunca rompen la respuesta al usuario (side-effect; 017).
   * @param {string} triggerEvent - Evento disparado ('task:completed', 'goal:completed', 'task:goal-changed', 'streak:updated')
   * @param {string} userId - ID del usuario que disparó el evento
   * @param {number|null} value - Solo para 'streak:updated': valor absoluto del streak actual
   * @param {Object} [context] - Datos del evento que el servidor ya conoce; el cliente nunca los aporta
   * @param {Date} [context.occurredAt] - Instante real del evento (`completedAt` de la tarea, `firstCompletedAt` de la meta).
   *   Si falta se usa el momento actual. NO es el momento en que se procesa un evento atrasado
   * @param {Date} [context.startedAt] - Inicio del ciclo medido (`createdAt` de la meta), para `maxDurationHours`
   * @param {string} [context.timezone] - Zona del usuario; si falta y alguna condición la necesita se lee del usuario
   * @returns {Promise<{notifiedAchievement: boolean, achievementsUnlocked: Array<{id: string, title: string, description: string}>}>}
   *   Si este evento desbloqueó y notificó un logro, y cuáles se completaron en esta llamada
   */
  static async processEvent(triggerEvent, userId, value = null, context = {}) {
    try {
      const shouldSetAbsoluteValue = triggerEvent === 'streak:updated';

      const matchingAchievements = await Achievement.find({ triggerEvent, isActive: true }).lean();
      if (!matchingAchievements.length) return { notifiedAchievement: false, achievementsUnlocked: [] };

      const evaluationContext = {
        occurredAt: context.occurredAt ?? new Date(),
        startedAt: context.startedAt ?? null,
        timezone: await this._resolveEventTimezone(userId, context.timezone, matchingAchievements),
      };

      const eligibleAchievements = [];
      const progressUpdateOps = [];
      for (const achievement of matchingAchievements) {
        const { passes, windowKey } = evaluateAchievementConditions(achievement.conditions, evaluationContext);
        if (!passes) continue;

        eligibleAchievements.push(achievement);
        progressUpdateOps.push({
          updateOne: {
            filter: { user: new mongoose.Types.ObjectId(userId), achievement: achievement._id },
            update: this._buildProgressPipeline({ achievement, shouldSetAbsoluteValue, value, windowKey }),
            upsert: true,
          },
        });
      }
      if (!progressUpdateOps.length) return { notifiedAchievement: false, achievementsUnlocked: [] };

      await UserAchievement.collection.bulkWrite(progressUpdateOps, { ordered: false });

      return await this._checkAndCompleteAchievements(userId, eligibleAchievements);
    } catch (error) {
      console.error(
        chalk.red('[side-effect] Error al procesar evento de logros (el request no falla; retry en 017):'),
        error
      );
      return { notifiedAchievement: false, achievementsUnlocked: [] };
    }
  }

  /**
   * Zona con la que se evalúan las condiciones: la del contexto, o la del usuario solo si algún logro la necesita.
   * @private
   * @param {string} userId
   * @param {string|undefined} contextTimezone
   * @param {Array} achievements - Logros que escuchan el evento
   * @returns {Promise<string>}
   */
  static async _resolveEventTimezone(userId, contextTimezone, achievements) {
    if (contextTimezone) return resolveTimeZone(contextTimezone);
    if (!achievements.some(achievement => conditionsNeedTimezone(achievement.conditions))) {
      return resolveTimeZone(null);
    }

    const user = await User.findById(userId).select('timezone').lean();
    return resolveTimeZone(user?.timezone);
  }

  /**
   * Pipeline de escritura del progreso según cómo cuenta el logro.
   * Con `sameWindow` y más de un evento requerido el progreso es el de la instancia de franja vigente; en otro caso
   * es acumulado (o el valor absoluto de la racha).
   * @private
   * @param {Object} params
   * @param {Object} params.achievement
   * @param {boolean} params.shouldSetAbsoluteValue
   * @param {number|null} params.value
   * @param {string|null} params.windowKey
   * @returns {Object[]}
   */
  static _buildProgressPipeline({ achievement, shouldSetAbsoluteValue, value, windowKey }) {
    if (shouldSetAbsoluteValue) return buildAbsoluteProgressPipeline(value);
    if (windowKey && achievement.targetCount > 1) return buildWindowProgressPipeline(windowKey);
    return buildIncrementProgressPipeline();
  }

  /**
   * Después de escribir el progreso completa los logros que alcanzaron su targetCount.
   * Un logro completado nunca se revierte: ni una racha que cae ni una edición del admin lo deshacen.
   * @private
   * @param {string} userId
   * @param {Array} achievements - Logros evaluados (con _id y targetCount)
   * @returns {Promise<{notifiedAchievement: boolean, achievementsUnlocked: Array<{id: string, title: string, description: string}>}>}
   */
  static async _checkAndCompleteAchievements(userId, achievements) {
    const achievementById = new Map(achievements.map(achievement => [achievement._id.toString(), achievement]));

    const pendingRows = await UserAchievement.find({
      user: userId,
      achievement: { $in: achievements.map(achievement => achievement._id) },
      status: { $ne: 'completed' },
    }).lean();

    const reachedRows = pendingRows.filter(
      row => row.currentCount >= (achievementById.get(row.achievement.toString())?.targetCount ?? Infinity)
    );

    return this._completeRows(reachedRows, achievementById);
  }

  /**
   * Reclama (completa) filas de progreso. El reclamo es condicional por fila (`status != completed`, `currentCount`
   * todavía en el `targetCount` leído y, con `sameWindow`, la misma franja con la que se seleccionó la fila): si dos
   * llamados compiten por la misma fila solo uno la reclama, y un reinicio de progreso concurrente la deja sin completar.
   * La guarda compara contra el `targetCount` en memoria (leído al seleccionar): NO relee el logro ni usa la sesión de la
   * edición, así que un objetivo subido en el medio no se revalida y la fila puede completarse por debajo del nuevo
   * objetivo (carrera aceptada, la completitud es irreversible). Solo se completan filas que cumplían el objetivo leído
   * en ese momento.
   *
   * El mismo reclamo deja constancia del aviso: toda finalización que se va a notificar escribe `notifiedAt`. La única
   * excepción es la finalización SILENCIOSA de un logro premium de un usuario free (`notifiedAt: null`, sin aviso): la
   * recoge el resumen de activación Premium (`notifyEarnedPremiumAchievements`).
   * @private
   * @param {Array} rows - Filas de UserAchievement que alcanzaron el objetivo
   * @param {Map<string, Object>} achievementById - Logros por id (string)
   * @returns {Promise<Array<{userId: string, achievement: Object, isSilent: boolean}>>} Solo las filas que ESTE llamado reclamó
   */
  static async _claimRows(rows, achievementById) {
    const now = new Date();
    const freeOwnerIds = await this._findFreeOwnerIdsOfPremiumRows(rows, achievementById);

    const claims = await mapWithConcurrency(rows, COMPLETION_CONCURRENCY, async row => {
      const achievement = achievementById.get(row.achievement.toString());
      if (!achievement) return null;

      const isSilent = achievement.tier === 'premium' && freeOwnerIds.has(row.user.toString());

      // El reclamo revalida lo que justificó la selección: un PUT concurrente pudo reiniciar el progreso (conteo y
      // franja), y completar es irreversible. El objetivo es el leído al seleccionar (puede estar desactualizado).
      const claimFilter = {
        _id: row._id,
        status: { $ne: 'completed' },
        currentCount: { $gte: achievement.targetCount },
      };
      if (achievement.conditions?.sameWindow === true) claimFilter['window.key'] = row.window?.key ?? null;

      const claimedRow = await UserAchievement.findOneAndUpdate(claimFilter, {
        $set: {
          status: 'completed',
          completedAt: now,
          unlockedAt: row.unlockedAt || now,
          notifiedAt: isSilent ? null : now,
        },
      });
      return claimedRow ? { userId: row.user.toString(), achievement, isSilent } : null;
    });

    return claims.filter(Boolean);
  }

  /**
   * De las filas que completan un logro premium, los dueños SIN acceso Premium (ni admin ni suscripción activa).
   * Es una lectura por llamada, solo si alguna fila es de un logro premium. El acceso se lee antes del reclamo: si el
   * usuario se vuelve premium justo en el medio, esa fila queda silenciosa hasta el próximo resumen de activación.
   * @private
   * @param {Array} rows - Filas de UserAchievement a reclamar
   * @param {Map<string, Object>} achievementById - Logros por id (string)
   * @returns {Promise<Set<string>>} Ids (string) de usuarios free
   */
  static async _findFreeOwnerIdsOfPremiumRows(rows, achievementById) {
    const premiumRowOwnerIds = [
      ...new Set(
        rows
          .filter(row => achievementById.get(row.achievement.toString())?.tier === 'premium')
          .map(row => row.user.toString())
      ),
    ];
    if (premiumRowOwnerIds.length === 0) return new Set();

    const owners = await User.find({ _id: { $in: premiumRowOwnerIds } })
      .select(PREMIUM_ACCESS_USER_SELECT)
      .lean();
    const premiumOwnerIds = new Set(owners.filter(hasPremiumAccess).map(owner => owner._id.toString()));
    return new Set(premiumRowOwnerIds.filter(ownerId => !premiumOwnerIds.has(ownerId)));
  }

  /**
   * Notifica los logros recién reclamados, con concurrencia acotada. Un fallo de notificación se registra y no corta.
   * Las finalizaciones silenciosas no se notifican.
   * @private
   * @param {Array<{userId: string, achievement: Object, isSilent: boolean}>} claims
   * @returns {Promise<void>}
   */
  static async _notifyClaimedAchievements(claims) {
    const audibleClaims = claims.filter(({ isSilent }) => !isSilent);
    await mapWithConcurrency(audibleClaims, COMPLETION_CONCURRENCY, async ({ userId, achievement }) => {
      try {
        await persistAndNotify({
          userId,
          title: '¡Nuevo logro desbloqueado!',
          body: achievement.title,
          url: '/achievements',
          type: 'achievement_completed',
          icon: '/notifications/crown.svg',
        });
      } catch (error) {
        console.error(chalk.yellow('[side-effect] Error al notificar logro desbloqueado:'), error);
      }
    });
  }

  /**
   * Completa filas de progreso y notifica solo las que ESTE llamado reclamó y no son silenciosas.
   * Una finalización silenciosa (premium de un usuario free) no cuenta como `notifiedAchievement` —así `goalService`
   * sigue enviando el `goal_completed` aparte— ni aparece en `achievementsUnlocked` (que alimenta los toasts).
   * @private
   * @param {Array} rows - Filas de UserAchievement que alcanzaron el objetivo
   * @param {Map<string, Object>} achievementById - Logros por id (string)
   * @returns {Promise<{notifiedAchievement: boolean, achievementsUnlocked: Array<{id: string, title: string, description: string}>}>}
   */
  static async _completeRows(rows, achievementById) {
    const claims = await this._claimRows(rows, achievementById);
    await this._notifyClaimedAchievements(claims);

    const audibleClaims = claims.filter(({ isSilent }) => !isSilent);
    return {
      notifiedAchievement: audibleClaims.length > 0,
      achievementsUnlocked: audibleClaims.map(({ achievement }) => ({
        id: achievement._id.toString(),
        title: achievement.title,
        description: achievement.description ?? '',
      })),
    };
  }

  /**
   * Avisa con UN solo resumen los logros premium que el usuario completó en silencio mientras no era Premium.
   * Se llama al activarse el acceso Premium (webhook de suscripción, toggle admin, flag `isAdmin`); el llamador ya
   * verificó que el usuario es Premium. Nunca lanza: un fallo se registra y el resumen se reintenta en la próxima activación.
   *
   * Exactamente una vez, con un lease en tres pasos:
   *  1. CLAIM: `updateMany` de las filas completadas sin `notifiedAt` y sin lease vigente, que les estampa un
   *     `notifyBatchId` nuevo y `notifyClaimedAt`. Dos llamados concurrentes reclaman filas distintas (la segunda ve el lease).
   *  2. NOTIFICAR: una única notificación por el lote reclamado (`persistAndNotify`). Sin filas reclamadas no hay nada que avisar.
   *  3. CONFIRMAR: recién con la notificación persistida se escribe `notifiedAt` en las filas del lote.
   * Si la notificación falla, el lote se libera (se quita el lote y el lease) para que otro intento lo envíe. Si la función
   * muere entre el claim y el confirm, las filas vuelven a ser reclamables al vencer el lease (2 minutos). Una muerte entre
   * persistir la notificación y confirmar puede duplicar el resumen en el re-claim (aceptado, poco probable).
   * Solo cuentan los logros premium ACTIVOS: son los que el usuario puede ver en el catálogo.
   * @param {string} userId
   * @returns {Promise<{notifiedCount: number}>} Cantidad de logros incluidos en el resumen enviado (0 si no hubo)
   */
  static async notifyEarnedPremiumAchievements(userId) {
    try {
      const premiumAchievements = await Achievement.find({ tier: 'premium', isActive: true }).select('_id').lean();
      if (premiumAchievements.length === 0) return { notifiedCount: 0 };

      const now = new Date();
      const batchId = new mongoose.Types.ObjectId();
      await UserAchievement.updateMany(
        {
          user: userId,
          achievement: { $in: premiumAchievements.map(achievement => achievement._id) },
          status: 'completed',
          notifiedAt: null,
          $or: [
            { notifyClaimedAt: null },
            { notifyClaimedAt: { $lt: new Date(now.getTime() - PREMIUM_SUMMARY_LEASE_MS) } },
          ],
        },
        { $set: { notifyBatchId: batchId, notifyClaimedAt: now } }
      );

      const claimedCount = await UserAchievement.countDocuments({ notifyBatchId: batchId });
      if (claimedCount === 0) return { notifiedCount: 0 };

      try {
        await persistAndNotify({
          userId,
          title: 'Tenés logros esperándote',
          body:
            claimedCount === 1
              ? 'Con lo que venías haciendo ya ganaste 1 logro Premium. Entrá a Logros para verlo.'
              : `Con lo que venías haciendo ya ganaste ${claimedCount} logros Premium. Entrá a Logros para verlos.`,
          url: '/achievements',
          type: 'achievements_premium_summary',
          icon: '/notifications/crown.svg',
        });
      } catch (error) {
        await UserAchievement.updateMany(
          { notifyBatchId: batchId, notifiedAt: null },
          { $unset: { notifyBatchId: '', notifyClaimedAt: '' } }
        );
        throw error;
      }

      await UserAchievement.updateMany({ notifyBatchId: batchId }, { $set: { notifiedAt: new Date() } });
      return { notifiedCount: claimedCount };
    } catch (error) {
      console.error(chalk.yellow('[side-effect] Error al enviar el resumen de logros Premium:'), error);
      return { notifiedCount: 0 };
    }
  }

  /**
   * Claves de la franja vigente "ahora" para las zonas que existen entre los usuarios (a lo sumo unas pocas: la
   * misma fecha difiere un día entre zonas). Es un filtro de base de datos; la pertenencia exacta se verifica por usuario.
   * @private
   * @param {Object} conditions - Condiciones de un logro con `sameWindow`
   * @param {Date} now
   * @returns {Promise<string[]>}
   */
  static async _findCurrentWindowKeys(conditions, now) {
    const storedTimezones = await User.distinct('timezone');
    const timezones = new Set([...storedTimezones, null].map(timezone => resolveTimeZone(timezone)));
    return [...new Set([...timezones].map(timezone => getCurrentWindowKey(conditions, timezone, now)))];
  }

  /**
   * Se queda con las filas cuya franja guardada es la vigente según la zona de SU usuario.
   * @private
   * @param {Array} rows - Filas de un logro con `sameWindow`
   * @param {Object} conditions
   * @param {Date} now
   * @returns {Promise<Array>}
   */
  static async _keepRowsInCurrentWindow(rows, conditions, now) {
    const owners = await User.find({ _id: { $in: rows.map(row => row.user) } })
      .select('timezone')
      .lean();
    const timezoneByUserId = new Map(owners.map(owner => [owner._id.toString(), owner.timezone]));

    return rows.filter(
      row =>
        row.window?.key ===
        getCurrentWindowKey(conditions, resolveTimeZone(timezoneByUserId.get(row.user.toString())), now)
    );
  }

  /**
   * Cuenta las filas con progreso sin completar de un logro. Con `sameWindow` `currentCount` guarda el conteo de la
   * ÚLTIMA franja que tuvo eventos y no se limpia: solo cuentan las filas cuya franja es la vigente de su usuario.
   * @param {Object} achievement - Logro (con `_id` y `conditions`)
   * @returns {Promise<number>}
   */
  static async countInProgress(achievement) {
    const inProgressFilter = { achievement: achievement._id, status: { $ne: 'completed' }, currentCount: { $gt: 0 } };
    if (achievement.conditions?.sameWindow !== true) return UserAchievement.countDocuments(inProgressFilter);

    const now = new Date();
    const candidateKeys = await this._findCurrentWindowKeys(achievement.conditions, now);
    const rowGroups = await UserAchievement.aggregate([
      { $match: { ...inProgressFilter, 'window.key': { $in: candidateKeys } } },
      {
        $lookup: {
          from: User.collection.name,
          let: { userId: '$user' },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$userId'] } } }, { $project: { timezone: 1 } }],
          as: 'owner',
        },
      },
      {
        $group: {
          _id: { windowKey: '$window.key', timezone: { $arrayElemAt: ['$owner.timezone', 0] } },
          count: { $sum: 1 },
        },
      },
    ]);

    return rowGroups.reduce((total, { _id: group, count }) => {
      const currentKey = getCurrentWindowKey(achievement.conditions, resolveTimeZone(group.timezone), now);
      return group.windowKey === currentKey ? total + count : total;
    }, 0);
  }

  /**
   * Tras bajar el `targetCount` de un logro, completa las filas en curso que ya alcanzaron el nuevo objetivo,
   * por el mismo reclamo y la misma notificación que un evento. Un logro inactivo no completa a nadie.
   * Corre por tandas de `COMPLETION_BATCH_SIZE`, en rondas de `COMPLETION_CONCURRENCY` filas (reclamo + notificación), y
   * se corta al agotar `COMPLETION_TIME_BUDGET_MS` contado desde el inicio del PUT (límite de 60 s).
   * Las filas que quedan sin completar se completan con el próximo evento que le cuente progreso al usuario (`_checkAndCompleteAchievements` revisa `currentCount >= targetCount` de toda fila no completada).
   * Con `sameWindow` `currentCount` es el conteo de la ÚLTIMA franja (no se limpia): solo completan las filas cuya
   * franja guardada es la vigente de su usuario; una franja vieja con muchos eventos no cuenta.
   * Es un efecto posterior a la edición: un fallo se registra y no deshace el cambio ya guardado.
   * @param {string} achievementId
   * @param {number} [startedAt] - Instante (ms) en que empezó el PUT; el presupuesto de tiempo corre desde ahí
   * @returns {Promise<{completedUsers: number, pendingCompletions: number|null}>} Usuarios completados en esta
   *   llamada y filas que quedaron pendientes (`null` si un fallo impidió contarlas)
   */
  static async completeReachedTarget(achievementId, startedAt = Date.now()) {
    let completedUsers = 0;
    try {
      const achievement = await Achievement.findOne({ _id: achievementId, isActive: true }).lean();
      if (!achievement) return { completedUsers: 0, pendingCompletions: 0 };

      const now = new Date();
      const isSameWindow = achievement.conditions?.sameWindow === true;
      const reachedFilter = {
        achievement: achievement._id,
        status: { $ne: 'completed' },
        currentCount: { $gte: achievement.targetCount },
        ...(isSameWindow && { 'window.key': { $in: await this._findCurrentWindowKeys(achievement.conditions, now) } }),
      };
      const achievementById = new Map([[achievement._id.toString(), achievement]]);
      const deadline = startedAt + COMPLETION_TIME_BUDGET_MS;

      // Se avanza por _id: las filas que no se completan (franja que no es la vigente de su usuario) no se reintentan.
      // El presupuesto se revisa por ronda de concurrencia: cada ronda reclama y notifica sus filas antes de la
      // siguiente, así nunca quedan filas reclamadas sin notificar y el exceso sobre el límite es una sola ronda.
      let lastVisitedId = null;
      let budgetExhausted = false;
      while (!budgetExhausted) {
        if (Date.now() >= deadline) break;
        const batchFilter = lastVisitedId ? { ...reachedFilter, _id: { $gt: lastVisitedId } } : reachedFilter;
        const batchRows = await UserAchievement.find(batchFilter).sort({ _id: 1 }).limit(COMPLETION_BATCH_SIZE).lean();
        if (batchRows.length === 0) break;

        const reachedRows = isSameWindow
          ? await this._keepRowsInCurrentWindow(batchRows, achievement.conditions, now)
          : batchRows;
        for (let start = 0; start < reachedRows.length; start += COMPLETION_CONCURRENCY) {
          if (Date.now() >= deadline) {
            budgetExhausted = true;
            break;
          }
          const claims = await this._claimRows(
            reachedRows.slice(start, start + COMPLETION_CONCURRENCY),
            achievementById
          );
          await this._notifyClaimedAchievements(claims);
          completedUsers += claims.length;
        }

        // Una tanda cortada a la mitad no avanza el cursor: sus filas sin reclamar siguen contando como pendientes
        // (las ya reclamadas quedan completadas y fuera del filtro).
        if (!budgetExhausted) lastVisitedId = batchRows[batchRows.length - 1]._id;
      }

      const unvisitedFilter = lastVisitedId ? { ...reachedFilter, _id: { $gt: lastVisitedId } } : reachedFilter;
      return { completedUsers, pendingCompletions: await UserAchievement.countDocuments(unvisitedFilter) };
    } catch (error) {
      console.error(
        chalk.yellow('[side-effect] Error al completar logros que ya alcanzaron el nuevo objetivo:'),
        error
      );
      return { completedUsers, pendingCompletions: null };
    }
  }
}
