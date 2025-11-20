import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para métricas generales del usuario
 * @typedef {Object} MetricsSchema
 * @property {mongoose.Types.ObjectId} userId - ID del usuario (requerido, único)
 * @property {number} currentStreak - Racha actual de días consecutivos
 * @property {number} bestStreak - Mejor racha histórica
 * @property {number} totalTasksCompleted - Total de tareas completadas
 * @property {number} totalGoalsCompleted - Total de metas completadas
 * @property {Date} lastActivityDate - Fecha de la última actividad
 * @property {Array} history - Historial de actividad diaria
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
    lastActivityDate: {
      type: Date,
      default: null,
    },
    history: [
      {
        date: {
          type: Date,
          required: true,
        },
        tasksCompleted: {
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

/**
 * Calcula la diferencia en días entre hoy y la última actividad
 * @private
 * @method _getDaysSinceLastActivity
 * @returns {Object} { today: Date, lastActivity: Date, diffDays: number }
 */
metricsSchema.methods._getDaysSinceLastActivity = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastActivityDate) {
    return { today, lastActivity: null, diffDays: null };
  }

  const lastActivity = new Date(this.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

  return { today, lastActivity, diffDays };
};

/**
 * Actualiza métricas cuando se completa una tarea
 * @method onTaskCompleted
 */
metricsSchema.methods.onTaskCompleted = function () {
  // Incrementar contador total
  this.totalTasksCompleted++;

  const { today, diffDays } = this._getDaysSinceLastActivity();

  // Si no hay actividad previa, iniciar racha
  if (diffDays === null) {
    this.currentStreak = 1;
    this.bestStreak = 1;
    this.lastActivityDate = new Date();
    this.history.push({ date: today, tasksCompleted: 1 });
    return;
  }

  const streakExpired = this.checkStreakExpiration();

  if (diffDays === 0) {
    // misma fecha - incrementar contador del día
    const todayRecord = this.history.find(h => h.date.toDateString() === today.toDateString());
    if (todayRecord) {
      todayRecord.tasksCompleted++;
    }
  } else if (diffDays === 1) {
    // Día consecutivo - incrementar racha
    this.currentStreak++;
    this.history.push({ date: today, tasksCompleted: 1 });

    // Actualizar mejor racha si es necesario
    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
    }
  } else if (streakExpired) {
    // Racha expiró (ya fue reseteada a 0 por checkStreakExpiration)
    // Reiniciar a 1 por esta nueva actividad
    this.currentStreak = 1;
    this.history.push({ date: today, tasksCompleted: 1 });
  }

  this.lastActivityDate = new Date();
};

/**
 * Actualiza métricas cuando se completa una meta
 * @method onGoalCompleted
 */
metricsSchema.methods.onGoalCompleted = function () {
  this.totalGoalsCompleted++;
};

/**
 * Verifica si la racha sigue activa
 * @method checkStreakExpiration
 * @returns {boolean} true si la racha expiró
 */
metricsSchema.methods.checkStreakExpiration = function () {
  const { diffDays } = this._getDaysSinceLastActivity();

  if (diffDays === null) return false;

  // Si pasó más de 1 día, la racha se rompió
  if (diffDays > 1) {
    this.currentStreak = 0;
    return true;
  }

  return false;
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
