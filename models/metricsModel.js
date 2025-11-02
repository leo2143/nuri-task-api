import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Metric simplificado
 * @typedef {Object} MetricSchema
 * @property {mongoose.Types.ObjectId} GoalId - ID de la meta (requerido, único)
 * @property {number} currentProgress - Progreso actual (0-100)
 * @property {number} currentStreak - Racha actual de semanas con progreso
 * @property {number} bestStreak - Mejor racha histórica
 * @property {string} notes - Notas opcionales del usuario
 * @property {Array} history - Historial de progreso con fecha
 * @property {Date} lastUpdated - Fecha de última actualización
 * @property {Date} createdAt - Fecha de creación (automático)
 * @property {Date} updatedAt - Fecha de última actualización (automático)
 */

/**
 * Esquema de metrica para la base de datos MongoDB
 * Define la estructura y validaciones para los documentos de metrica
 * Cada meta tiene UNA métrica que se actualiza con el progreso
 * Enfoque motivacional: muestra avance y favorece constancia, sin evaluar rendimiento
 * @constant {mongoose.Schema} metricsSchema
 */
const metricsSchema = new mongoose.Schema(
  {
    GoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: true,
      unique: true, // Una métrica por meta
    },
    currentProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    // Historial simplificado: solo progreso y fecha
    history: [
      {
        progress: {
          type: Number,
          min: 0,
          max: 100,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ========== MÉTODOS DEL ESQUEMA ==========

/**
 * Actualiza la racha actual de progreso
 * Solo cuenta semanas con progreso > 0
 * @method updateStreak
 */
metricsSchema.methods.updateStreak = function () {
  if (this.history.length === 0) {
    this.currentStreak = 0;
    return;
  }

  let streak = 0;
  // Contar desde el final del historial hacia atrás
  for (let i = this.history.length - 1; i >= 0; i--) {
    if (this.history[i].progress > 0) {
      streak++;
    } else {
      break;
    }
  }

  this.currentStreak = streak;

  // Actualizar mejor racha si es necesario
  if (streak > this.bestStreak) {
    this.bestStreak = streak;
  }
};

// ========== HOOKS PRE-SAVE ==========

/**
 * Hook pre-save para actualizar rachas automáticamente
 */
metricsSchema.pre('save', function (next) {
  // Actualizar rachas si hay progreso
  if (this.currentProgress > 0) {
    this.updateStreak();
  }

  // Actualizar lastUpdated
  this.lastUpdated = new Date();

  next();
});

// Configurar para que los virtuals se incluyan en JSON y Object
metricsSchema.set('toJSON', { virtuals: true });
metricsSchema.set('toObject', { virtuals: true });

/**
 * Modelo de Métrica para MongoDB
 * @class Metric
 * @extends mongoose.Model
 * @description Modelo que representa una métrica única por meta en la base de datos
 * Enfoque motivacional: sin evaluaciones negativas ni comparaciones con ideales
 */
const Metrics = mongoose.model('Metrics', metricsSchema);
export default Metrics;
