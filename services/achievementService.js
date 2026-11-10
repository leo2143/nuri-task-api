import Achievement from '../models/achievementModel.js';
import UserAchievement from '../models/userAchievementModel.js';
import {
  ACHIEVEMENT_TYPES,
  buildAchievementCatalog,
  buildDisallowedConditionsMessage,
  getDisallowedConditionKeys,
} from '../models/achievementCatalog.js';
import {
  NotFoundResponseModel,
  ErrorResponseModel,
  BadRequestResponseModel,
  ConflictResponseModel,
} from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import { CreateAchievementDto, UpdateAchievementDto, AchievementFilterDto } from '../models/dtos/achievements/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { UserAchievementService } from './userAchievementService.js';
import mongoose from 'mongoose';

/**
 * Forma comparable de `conditions`: dos objetos con el mismo significado dan el mismo texto
 * (sin `sameWindow` equivale a `sameWindow: false`).
 * @param {Object|null|undefined} conditions
 * @returns {string}
 */
function toComparableConditions(conditions) {
  return JSON.stringify({
    timeWindow: conditions?.timeWindow ? { start: conditions.timeWindow.start, end: conditions.timeWindow.end } : null,
    sameWindow: conditions?.sameWindow === true,
    maxDurationHours: conditions?.maxDurationHours ?? null,
  });
}

/**
 * Un cambio de evento o de condiciones cambia QUÉ cuenta como progreso: el progreso en curso deja de ser válido.
 * @param {Object} existing - Logro guardado
 * @param {Object} cleanData - Cambios validados
 * @returns {boolean}
 */
function changesProgressMeaning(existing, cleanData) {
  const triggerChanged = cleanData.triggerEvent !== undefined && cleanData.triggerEvent !== existing.triggerEvent;
  const conditionsChanged =
    cleanData.conditions !== undefined &&
    toComparableConditions(cleanData.conditions) !== toComparableConditions(existing.conditions);
  return triggerChanged || conditionsChanged;
}

// La transacción de la edición debe caber en el PUT (`maxDuration = 60` s): no se abren intentos nuevos pasados 40 s
// desde que empezó el PUT, y el commit tiene como máximo 10 s
const TRANSACTION_ATTEMPT_DEADLINE_MS = 40_000;
const TRANSACTION_COMMIT_MAX_TIME_MS = 10_000;

/** La edición agotó su presupuesto de tiempo antes de abrir un intento de transacción: se puede reintentar. */
class EditBudgetExceededError extends Error {}

/**
 * Indica si el error de Mongo es "este servidor no admite transacciones" (mongod suelto, sin replica set).
 * @param {Error} error
 * @returns {boolean}
 */
function isTransactionsUnsupportedError(error) {
  return error?.codeName === 'IllegalOperation' && /replica set|mongos|transaction numbers/i.test(error.message ?? '');
}

/**
 * Servicio para gestionar plantillas globales de logros (solo administradores)
 */
export class AchievementService {
  /**
   * Obtiene todas las plantillas de logros con filtros opcionales
   * @param {Object} [filters={}] - Filtros de búsqueda (type, isActive, search, sortBy, sortOrder)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista de plantillas o error
   */
  static async getAllAchievements(filters = {}) {
    try {
      const filterDto = new AchievementFilterDto(filters);
      const validation = filterDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const query = filterDto.toMongoQuery();
      const sort = filterDto.toMongoSort();

      const achievements = await Achievement.find(query)
        .sort(sort)
        .limit(filterDto.limit + 1)
        .lean();

      const { results, meta } = filterDto.processPaginationResults(achievements);

      if (results.length === 0) {
        return new NotFoundResponseModel('No se encontraron plantillas de logros');
      }

      return new SuccessResponseModel(results, 'Plantillas de logros obtenidas correctamente', 200, meta);
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener plantillas de logros');
    }
  }

  /**
   * Obtiene lo que el formulario de administración puede elegir: eventos disparadores y las condiciones de cada uno
   * @returns {SuccessResponseModel} Respuesta con `{ triggers: [{ triggerEvent, allowedConditions }], types }`
   */
  static getAchievementCatalog() {
    return new SuccessResponseModel(buildAchievementCatalog(), 'Catálogo de logros obtenido correctamente');
  }

  /**
   * Cuenta los usuarios con progreso sin completar en un logro: a ellos les afecta (se les reinicia el progreso)
   * un cambio de evento o de condiciones. El formulario de administración lo muestra antes de guardar.
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|BadRequestResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   *   Respuesta con `{ inProgressCount }`
   */
  static async getInProgressCount(achievementId) {
    try {
      if (!mongoose.isValidObjectId(achievementId)) {
        return new BadRequestResponseModel('El id del logro no es válido');
      }

      const achievement = await Achievement.findById(achievementId).select('conditions').lean();
      if (!achievement) {
        return new NotFoundResponseModel('Plantilla de logro no encontrada');
      }

      const inProgressCount = await UserAchievementService.countInProgress(achievement);

      return new SuccessResponseModel({ inProgressCount }, 'Usuarios con progreso en curso obtenidos correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'contar usuarios con progreso en curso');
    }
  }

  /**
   * Obtiene una plantilla de logro por ID
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la plantilla o error
   */
  static async getAchievementById(achievementId) {
    try {
      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return new NotFoundResponseModel('Plantilla de logro no encontrada');
      }
      return new SuccessResponseModel(achievement, 'Plantilla de logro obtenida correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener plantilla de logro');
    }
  }

  /**
   * Crea una nueva plantilla de logro (solo administradores)
   * @param {Object} achievementData - Datos del logro
   * @param {string} achievementData.title - Título del logro
   * @param {string} achievementData.description - Descripción del logro
   * @param {number} achievementData.targetCount - Cantidad objetivo
   * @param {string} achievementData.type - Tipo de logro
   * @param {string} achievementData.reward - Recompensa del logro
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con la plantilla creada o error
   */
  static async createAchievement(achievementData) {
    try {
      const createDto = new CreateAchievementDto(achievementData);
      const validation = createDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = createDto.toPlainObject();
      const achievement = new Achievement(cleanData);
      const savedAchievement = await achievement.save();
      return new CreatedResponseModel(savedAchievement, 'Plantilla de logro creada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'crear plantilla de logro');
    }
  }

  /**
   * Actualiza una plantilla de logro existente (solo administradores)
   * @param {string} achievementId - ID del logro
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<SuccessResponseModel|BadRequestResponseModel|NotFoundResponseModel|ConflictResponseModel|ErrorResponseModel>}
   *   Respuesta con la plantilla actualizada y `meta.pendingCompletions` (usuarios que alcanzaron el nuevo objetivo y
   *   todavía no se completaron; 0 si no hubo cambio de objetivo; null si no se pudo contar), o error.
   *   409 si otra edición modificó el logro mientras tanto
   */
  static async updateAchievement(achievementId, updateData) {
    const startedAt = Date.now();
    try {
      const updateDto = new UpdateAchievementDto(updateData);
      const validation = updateDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      if (!mongoose.isValidObjectId(achievementId)) {
        return new BadRequestResponseModel('El id del logro no es válido');
      }

      const existing = await Achievement.findById(achievementId).lean();
      if (!existing) {
        return new NotFoundResponseModel('Plantilla de logro no encontrada');
      }

      const cleanData = updateDto.toPlainObject();

      // Las condiciones deben ser válidas para el evento resultante, aunque el cambio traiga solo una de las dos cosas
      const resultingTrigger = cleanData.triggerEvent ?? existing.triggerEvent;
      const resultingConditions = cleanData.conditions ?? existing.conditions;
      const disallowedKeys = getDisallowedConditionKeys(resultingTrigger, resultingConditions);
      if (disallowedKeys.length > 0) {
        return new BadRequestResponseModel(buildDisallowedConditionsMessage(resultingTrigger, disallowedKeys));
      }

      // Si la edición cambia el significado del progreso, guardado y reinicio van en UNA transacción (o quedan ambos o
      // ninguno); si no, es un único guardado con guarda optimista. Ver #saveAndResetProgress para la carrera aceptada.
      const outcome = await this.#saveAndResetProgress(achievementId, existing, cleanData, startedAt);
      if (outcome.conflict) {
        return outcome.stillExists
          ? new ConflictResponseModel('El logro fue modificado por otra edición. Recargalo y volvé a intentar.')
          : new NotFoundResponseModel('Plantilla de logro no encontrada');
      }
      const { achievement } = outcome;

      const pendingCompletions = await this.#completeIfTargetChanged(existing, cleanData, startedAt);

      return new SuccessResponseModel(achievement, 'Plantilla de logro actualizada correctamente', 200, {
        pendingCompletions,
      });
    } catch (error) {
      if (error instanceof EditBudgetExceededError) return new ErrorResponseModel(error.message, 503);
      return ErrorHandler.handleDatabaseError(error, 'actualizar plantilla de logro');
    }
  }

  /**
   * Guarda la definición y aplica la política de edición sobre el progreso de los usuarios:
   * - un logro completado NUNCA se revoca
   * - si cambian el evento o las condiciones, el progreso en curso se reinicia (ya no mide lo mismo)
   * - si solo cambia el targetCount, el progreso se conserva (la finalización va aparte, después del guardado y solo
   *   cuando NO cambió el evento ni las condiciones, o sea en el camino sin transacción)
   * - editar título, descripción, recompensa, imagen o isActive no toca el progreso
   * Solo cuando cambia el significado del progreso se abre una transacción (requiere replica set; Atlas lo es): el
   * guardado de la definición y el reinicio de las filas sin completar quedan ambos o ninguno. Cualquier otra edición es
   * un único guardado con la misma guarda, sin transacción.
   * Lo que la transacción NO garantiza: `processEvent` lee la definición y evalúa las condiciones ANTES de ella y escribe
   * el progreso fuera de toda sesión, así que un evento evaluado con la definición vieja puede sumar progreso a una fila
   * justo después del reinicio (carrera aceptada: ese avance se cuenta con las reglas viejas). Los conflictos de escritura
   * solo ordenan las escrituras; no hacen que el evento se reevalúe.
   * Cota de tiempo: el PUT tiene `maxDuration = 60` s. `withTransaction` reintenta errores transitorios hasta 120 s, así que
   * el callback no abre intentos pasados 40 s desde `startedAt` (lanza un error que no es de Mongo y corta los reintentos;
   * la API responde 503 con un mensaje para reintentar) y el commit tiene `maxCommitTimeMS` de 10 s. Esa cota solo
   * limita el INICIO de cada intento: un `updateMany` largo o los reintentos del commit del driver no quedan acotados
   * por ella. Esta fase no comparte presupuesto con `completeReachedTarget`: ese solo
   * corre cuando NO hubo reinicio, es decir, cuando no hubo transacción.
   * Si el servidor no admite transacciones se registra un error y se relanza (no hay alternativa sin transacción).
   * Guardado optimista: solo gana quien edita sobre la versión que leyó (`updatedAt`). Los logros importados o migrados
   * pueden no tener `updatedAt`: en ese caso la guarda exige que siga sin existir. Si la guarda no coincide no se
   * escribe nada.
   * @param {string} achievementId - ID del logro
   * @param {Object} existing - Logro antes del cambio
   * @param {Object} cleanData - Cambios validados
   * @param {number} startedAt - Instante (ms) en que empezó el PUT, para acotar la transacción
   * @returns {Promise<{conflict: false, achievement: Object}|{conflict: true, stillExists: boolean}>}
   */
  static async #saveAndResetProgress(achievementId, existing, cleanData, startedAt) {
    if (!changesProgressMeaning(existing, cleanData)) {
      return this.#saveGuardedDefinition(achievementId, existing, cleanData);
    }

    const session = await mongoose.startSession();
    try {
      let outcome;
      // withTransaction puede repetir el callback ante errores transitorios: el resultado se recalcula en cada intento
      await session.withTransaction(
        async () => {
          if (Date.now() - startedAt > TRANSACTION_ATTEMPT_DEADLINE_MS) {
            throw new EditBudgetExceededError('La edición del logro superó el tiempo disponible. Volvé a intentar.');
          }

          outcome = await this.#saveGuardedDefinition(achievementId, existing, cleanData, session);
          if (outcome.conflict) return;

          await UserAchievement.updateMany(
            { achievement: existing._id, status: { $ne: 'completed' } },
            { $set: { currentCount: 0, status: 'locked', window: null } },
            { session }
          );
        },
        { maxCommitTimeMS: TRANSACTION_COMMIT_MAX_TIME_MS }
      );
      return outcome;
    } catch (error) {
      if (isTransactionsUnsupportedError(error)) {
        console.error(
          'La edición de logros que cambia el evento o las condiciones requiere una base con replica set (transacciones): el servidor actual no las admite.',
          error
        );
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Guarda la definición con la guarda optimista sobre `updatedAt` (con o sin sesión de transacción). Si la guarda no
   * coincide no escribe nada y distingue "modificado por otra edición" de "ya no existe".
   * @param {string} achievementId - ID del logro
   * @param {Object} existing - Logro antes del cambio
   * @param {Object} cleanData - Cambios validados
   * @param {import('mongoose').ClientSession} [session] - Sesión de la transacción, si hay una
   * @returns {Promise<{conflict: false, achievement: Object}|{conflict: true, stillExists: boolean}>}
   */
  static async #saveGuardedDefinition(achievementId, existing, cleanData, session) {
    const versionGuard = existing.updatedAt ? { updatedAt: existing.updatedAt } : { updatedAt: { $exists: false } };
    const sessionOptions = session ? { session } : {};

    const achievement = await Achievement.findOneAndUpdate(
      { _id: achievementId, ...versionGuard },
      { $set: cleanData },
      { new: true, runValidators: true, ...sessionOptions }
    );
    if (achievement) return { conflict: false, achievement };

    const stillExists = await Achievement.exists({ _id: achievementId }).session(session ?? null);
    return { conflict: true, stillExists: Boolean(stillExists) };
  }

  /**
   * Si solo cambió el targetCount, completa a quien ya alcanzó el nuevo objetivo. Corre con la definición ya guardada
   * porque lee el objetivo vigente de la base. Es por tandas con presupuesto de tiempo: lo que no alcanza queda pendiente
   * y se completa con el próximo evento del usuario.
   * @param {Object} existing - Logro antes del cambio
   * @param {Object} cleanData - Cambios aplicados
   * @param {number} startedAt - Instante (ms) en que empezó el PUT, para el presupuesto de tiempo
   * @returns {Promise<number|null>} Filas que quedaron pendientes de completar (null si no se pudo contar)
   */
  static async #completeIfTargetChanged(existing, cleanData, startedAt) {
    const targetChanged = cleanData.targetCount !== undefined && cleanData.targetCount !== existing.targetCount;
    if (changesProgressMeaning(existing, cleanData) || !targetChanged) return 0;

    const { pendingCompletions } = await UserAchievementService.completeReachedTarget(existing._id, startedAt);
    return pendingCompletions;
  }

  /**
   * Elimina una plantilla de logro (solo administradores)
   * @param {string} achievementId - ID del logro
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con confirmación de eliminación o error
   */
  static async deleteAchievement(achievementId) {
    try {
      const achievement = await Achievement.findByIdAndDelete(achievementId);

      if (!achievement) {
        return new NotFoundResponseModel('Plantilla de logro no encontrada');
      }

      return new SuccessResponseModel(achievement, 'Plantilla de logro eliminada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar plantilla de logro');
    }
  }

  /**
   * Obtiene plantillas de logros por tipo
   * @param {string} type - Tipo de logro (task/goal/metric/streak)
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con las plantillas filtradas o error
   */
  static async getAchievementsByType(type, pagination = {}) {
    try {
      if (!ACHIEVEMENT_TYPES.includes(type)) {
        return new BadRequestResponseModel(`El tipo debe ser uno de: ${ACHIEVEMENT_TYPES.join(', ')}`);
      }

      const paginationDto = new AchievementFilterDto(pagination);
      const query = { type, isActive: true };
      paginationDto.applyCursorToQuery(query);

      const achievements = await Achievement.find(query)
        .sort(paginationDto.toMongoSort())
        .limit(paginationDto.limit + 1)
        .lean();

      const { results, meta } = paginationDto.processPaginationResults(achievements);

      if (results.length === 0) {
        return new NotFoundResponseModel(`No se encontraron plantillas de logros de tipo ${type}`);
      }

      return new SuccessResponseModel(
        results,
        `Plantillas de logros de tipo ${type} obtenidas correctamente`,
        200,
        meta
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener plantillas de logros por tipo');
    }
  }

  /**
   * Obtiene estadísticas de plantillas de logros
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con estadísticas o error
   */
  static async getAchievementStats() {
    try {
      const total = await Achievement.countDocuments();
      const active = await Achievement.countDocuments({ isActive: true });
      const inactive = await Achievement.countDocuments({ isActive: false });

      const byType = await Achievement.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]);

      const stats = {
        total,
        active,
        inactive,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };

      return new SuccessResponseModel(stats, 'Estadísticas de plantillas de logros obtenidas correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener estadísticas de plantillas de logros');
    }
  }
}
