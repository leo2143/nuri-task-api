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
import mongoose from 'mongoose';
import chalk from 'chalk';

const POPULATE_USER_FIELDS = 'name email avatar';
// Completar a todos los usuarios tras bajar un objetivo corre dentro del PUT del admin (Vercel: maxDuration = 60 s):
// se hace por tandas y con un presupuesto de tiempo; lo que no alcanza se completa con el próximo evento del usuario.
const COMPLETION_BATCH_SIZE = 200;
const COMPLETION_TIME_BUDGET_MS = 40_000;
const COMPLETION_CONCURRENCY = 10;
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
   * Obtiene todos los logros con el progreso del usuario
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

      const user = await User.findById(userId).select('subscription isAdmin').lean();
      const isPremium = user?.isAdmin || user?.subscription?.isActive;

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
          ...achievement,
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
   * Obtiene el progreso del usuario en un logro específico
   * @param {string} userId - ID del usuario
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el progreso del usuario
   * Incluye populate de userId (User) y achievementId (Achievement)
   */
  static async getUserAchievementProgress(userId, achievementId) {
    try {
      const userAchievement = await UserAchievement.findOne({ user: userId, achievement: achievementId })
        .populate('user', POPULATE_USER_FIELDS)
        .populate('achievement');

      if (!userAchievement) {
        // Si no existe progreso, devolver valores por defecto
        const achievementData = await Achievement.findById(achievementId);
        if (!achievementData) {
          return new NotFoundResponseModel('Logro no encontrado');
        }

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
   * Obtiene estadísticas de logros del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>}
   */
  static async getUserStats(userId) {
    try {
      const totalAchievements = await Achievement.countDocuments({ isActive: true });
      const userProgress = await UserAchievement.find({ user: userId });

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
   * Reclama (completa) filas de progreso. El reclamo es condicional por fila (`status != completed`): si dos
   * llamados compiten por la misma fila solo uno la reclama.
   * @private
   * @param {Array} rows - Filas de UserAchievement que alcanzaron el objetivo
   * @param {Map<string, Object>} achievementById - Logros por id (string)
   * @returns {Promise<Array<{userId: string, achievement: Object}>>} Solo las filas que ESTE llamado reclamó
   */
  static async _claimRows(rows, achievementById) {
    const now = new Date();

    const claims = await mapWithConcurrency(rows, COMPLETION_CONCURRENCY, async row => {
      const achievement = achievementById.get(row.achievement.toString());
      if (!achievement) return null;

      const claimedRow = await UserAchievement.findOneAndUpdate(
        { _id: row._id, status: { $ne: 'completed' } },
        { $set: { status: 'completed', completedAt: now, unlockedAt: row.unlockedAt || now } }
      );
      return claimedRow ? { userId: row.user.toString(), achievement } : null;
    });

    return claims.filter(Boolean);
  }

  /**
   * Notifica los logros recién reclamados, con concurrencia acotada. Un fallo de notificación se registra y no corta.
   * @private
   * @param {Array<{userId: string, achievement: Object}>} claims
   * @returns {Promise<void>}
   */
  static async _notifyClaimedAchievements(claims) {
    await mapWithConcurrency(claims, COMPLETION_CONCURRENCY, async ({ userId, achievement }) => {
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
   * Completa filas de progreso y notifica solo las que ESTE llamado reclamó.
   * @private
   * @param {Array} rows - Filas de UserAchievement que alcanzaron el objetivo
   * @param {Map<string, Object>} achievementById - Logros por id (string)
   * @returns {Promise<{notifiedAchievement: boolean, achievementsUnlocked: Array<{id: string, title: string, description: string}>}>}
   */
  static async _completeRows(rows, achievementById) {
    const claims = await this._claimRows(rows, achievementById);
    await this._notifyClaimedAchievements(claims);

    return {
      notifiedAchievement: claims.length > 0,
      achievementsUnlocked: claims.map(({ achievement }) => ({
        id: achievement._id.toString(),
        title: achievement.title,
        description: achievement.description ?? '',
      })),
    };
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
   * Corre por tandas de `COMPLETION_BATCH_SIZE` y se corta al agotar `COMPLETION_TIME_BUDGET_MS` (el llamador es un
   * PUT con límite de 60 s). Las filas que quedan sin completar se completan con el próximo evento que le cuente
   * progreso al usuario (`_checkAndCompleteAchievements` revisa `currentCount >= targetCount` de toda fila no completada).
   * Con `sameWindow` `currentCount` es el conteo de la ÚLTIMA franja (no se limpia): solo completan las filas cuya
   * franja guardada es la vigente de su usuario; una franja vieja con muchos eventos no cuenta.
   * Es un efecto posterior a la edición: un fallo se registra y no deshace el cambio ya guardado.
   * @param {string} achievementId
   * @returns {Promise<{completedUsers: number, pendingCompletions: number|null}>} Usuarios completados en esta
   *   llamada y filas que quedaron pendientes (`null` si un fallo impidió contarlas)
   */
  static async completeReachedTarget(achievementId) {
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
      const deadline = Date.now() + COMPLETION_TIME_BUDGET_MS;

      // Se avanza por _id: las filas que no se completan (franja que no es la vigente de su usuario) no se reintentan
      let lastVisitedId = null;
      while (Date.now() < deadline) {
        const batchFilter = lastVisitedId ? { ...reachedFilter, _id: { $gt: lastVisitedId } } : reachedFilter;
        const batchRows = await UserAchievement.find(batchFilter).sort({ _id: 1 }).limit(COMPLETION_BATCH_SIZE).lean();
        if (batchRows.length === 0) break;
        lastVisitedId = batchRows[batchRows.length - 1]._id;

        const reachedRows = isSameWindow
          ? await this._keepRowsInCurrentWindow(batchRows, achievement.conditions, now)
          : batchRows;
        const claims = await this._claimRows(reachedRows, achievementById);
        await this._notifyClaimedAchievements(claims);
        completedUsers += claims.length;
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
