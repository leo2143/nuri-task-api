import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Metric
 * @typedef {Object} MetricSchema
 * @property {mongoose.Types.ObjectId} GoalId - ID de la meta (requerido, único)
 * @property {string} currentWeek - Semana actual
 * @property {number} currentProgress - Progreso actual (0-100)
 * @property {string} currentNotes - Notas actuales
 * @property {Array} history - Historial de progreso semanal
 * @property {Date} lastUpdated - Fecha de última actualización
 * @property {Date} createdAt - Fecha de creación (automático)
 * @property {Date} updatedAt - Fecha de última actualización (automático)
 */

/**
 * Esquema de metrica para la base de datos MongoDB
 * Define la estructura y validaciones para los documentos de metrica
 * Cada meta tiene UNA métrica que se actualiza con el progreso
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
    currentWeek: {
      type: String,
      required: true,
    },
    currentProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    currentNotes: {
      type: String,
      trim: true,
      default: '',
    },
    history: [
      {
        week: {
          type: String,
          required: true,
        },
        progress: {
          type: Number,
          min: 0,
          max: 100,
        },
        notes: {
          type: String,
          trim: true,
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

/**
 * Modelo de Métrica para MongoDB
 * @class Metric
 * @extends mongoose.Model
 * @description Modelo que representa una métrica única por meta en la base de datos
 * La métrica se actualiza con el progreso y mantiene un historial
 * @example
 * // Crear una nueva métrica para una meta
 * const metric = new Metrics({
 *   GoalId: '68d1e7f577ec3fe8073cef21',
 *   currentWeek: 'Semana 1',
 *   currentProgress: 15,
 *   currentNotes: 'Buen inicio',
 *   history: []
 * });
 */
const Metrics = mongoose.model('Metrics', metricsSchema);
export default Metrics;
