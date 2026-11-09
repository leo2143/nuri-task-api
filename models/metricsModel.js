import mongoose from 'mongoose';
import { toLocalYmd } from '../services/helpers/dateTime.js';
import { getEffectiveStreak } from '../services/helpers/streakDays.js';

/**
 * Esquema de Mongoose para métricas generales del usuario
 * @typedef {Object} MetricsSchema
 * @property {mongoose.Types.ObjectId} userId - ID del usuario (requerido, único)
 * @property {number} currentStreak - Racha guardada (la efectiva se calcula al leer con `getEffectiveStreak`)
 * @property {number} bestStreak - Mejor racha histórica
 * @property {number} totalTasksCompleted - Total de tareas completadas
 * @property {number} totalGoalsCompleted - Total de metas completadas
 * @property {string|null} lastActivityDay - Día local `YYYY-MM-DD` de la última actividad (tarea o meta)
 * @property {Date} lastActivityDate - Instante de la última actividad
 * @property {Array} history - Un registro por día local activo: `{ date, day, tasksCompleted, goalsCompleted }`
 *
 * Las escrituras de actividad no pasan por `save()`: las hace `MetricsService` con un pipeline atómico
 * (`services/helpers/metricsActivityPipeline.js`).
 */

const metricsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Una métrica por usuario
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTasksCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGoalsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityDay: {
      type: String,
      default: null,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
    history: [
      {
        // Inicio del día local (instante)
        date: {
          type: Date,
          required: true,
        },
        // Clave de día local `YYYY-MM-DD`
        day: {
          type: String,
          required: true,
        },
        tasksCompleted: {
          type: Number,
          default: 0,
        },
        goalsCompleted: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

metricsSchema.index({ lastActivityDay: 1 });

/**
 * Racha efectiva: 0 si pasó más de un día local desde la última actividad. No escribe nada.
 * @method getEffectiveStreak
 * @param {string} timeZone - Zona del usuario (usar `resolveTimeZone(user.timezone)`)
 * @param {Date} [now]
 * @returns {number}
 */
metricsSchema.methods.getEffectiveStreak = function (timeZone, now = new Date()) {
  return getEffectiveStreak(this, toLocalYmd(now, timeZone));
};

metricsSchema.set('toJSON', { versionKey: false });
metricsSchema.set('toObject', { versionKey: false });

/**
 * Modelo de Metrics para MongoDB
 * @class Metrics
 * @extends mongoose.Model
 * @description Modelo que representa las métricas generales de actividad de un usuario
 */
const Metrics = mongoose.model('Metrics', metricsSchema);
export default Metrics;
