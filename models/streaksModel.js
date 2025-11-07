import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Streak
 * @typedef {Object} StreakSchema
 * @property {mongoose.Types.ObjectId} userId - ID del usuario (requerido, único)
 * @property {number} currentStreak - Racha actual de días consecutivos
 * @property {number} bestStreak - Mejor racha histórica
 * @property {Date} lastActivityDate - Fecha de la última actividad (tarea completada)
 * @property {Array} history - Historial de actividad diaria
 * @property {Date} createdAt - Fecha de creación (automático)
 * @property {Date} updatedAt - Fecha de última actualización (automático)
 */

/**
 * Esquema de racha para la base de datos MongoDB
 * Define la estructura y validaciones para el seguimiento de rachas de usuarios
 * Se actualiza cada vez que un usuario completa una tarea
 * @constant {mongoose.Schema} streakSchema
 */
const streakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Un registro de racha por usuario
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
    lastActivityDate: {
      type: Date,
      default: null,
    },
    // Historial simplificado: un registro por día con actividad
    history: [
      {
        date: {
          type: Date,
          required: true,
        },
        tasksCompleted: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ========== MÉTODOS DEL ESQUEMA ==========

/**
 * Actualiza la racha cuando se completa una tarea
 * @method updateStreakOnTaskComplete
 */
streakSchema.methods.updateStreakOnTaskComplete = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar a medianoche

  // Si no hay actividad previa, iniciar racha
  if (!this.lastActivityDate) {
    this.currentStreak = 1;
    this.bestStreak = 1;
    this.lastActivityDate = new Date();
    this.history.push({ date: today, tasksCompleted: 1 });
    return;
  }

  const lastActivity = new Date(this.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Misma fecha - incrementar contador del día
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
  } else {
    // Racha rota - reiniciar
    this.currentStreak = 1;
    this.history.push({ date: today, tasksCompleted: 1 });
  }

  this.lastActivityDate = new Date();
};

/**
 * Verifica si la racha sigue activa
 * @method checkStreakExpiration
 * @returns {boolean} true si la racha expiró
 */
streakSchema.methods.checkStreakExpiration = function () {
  if (!this.lastActivityDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = new Date(this.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

  // Si pasó más de 1 día, la racha se rompió
  if (diffDays > 1) {
    this.currentStreak = 0;
    return true;
  }

  return false;
};

// Configurar para que los virtuals se incluyan en JSON y Object
streakSchema.set('toJSON', { virtuals: true });
streakSchema.set('toObject', { virtuals: true });

/**
 * Modelo de Streak para MongoDB
 * @class Streak
 * @extends mongoose.Model
 * @description Modelo que representa las rachas de actividad de un usuario
 */
const Streak = mongoose.model('Streak', streakSchema);
export default Streak;
