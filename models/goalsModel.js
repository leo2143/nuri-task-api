import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Goal
 * @typedef {Object} GoalSchema
 * @property {string} title - Título de la meta (requerido)
 * @property {string} description - Descripción de la meta
 * @property {string} status - Estado de la meta (active/paused/completed)
 * @property {string} priority - Prioridad de la meta (low/medium/high)
 * @property {Date} dueDate - Fecha límite de la meta
 * @property {Object} smart - Criterios SMART de la meta
 * @property {string} smart.specific - Criterio específico
 * @property {string} smart.measurable - Criterio medible
 * @property {string} smart.achievable - Criterio alcanzable
 * @property {string} smart.relevant - Criterio relevante
 * @property {string} smart.timeBound - Criterio con tiempo límite
 * @property {Array} metrics - Progreso semanal
 * @property {Array} comments - Feedback o histórico
 * @property {mongoose.Types.ObjectId} userId - ID del usuario propietario (requerido)
 * @property {Date} createdAt - Fecha de creación (automático)
 * @property {Date} updatedAt - Fecha de última actualización (automático)
 */

/**
 * Esquema de meta (goal) para la base de datos MongoDB
 * Define la estructura y validaciones para los documentos de metas
 * @constant {mongoose.Schema} goalSchema
 */
const goalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    smart: {
      specific: {
        type: String,
        required: true,
        trim: true,
      },
      measurable: {
        type: String,
        required: true,
        trim: true,
      },
      achievable: {
        type: String,
        required: true,
        trim: true,
      },
      relevant: {
        type: String,
        required: true,
        trim: true,
      },
      timeBound: {
        type: String,
        required: true,
        trim: true,
      },
    },
    metrics: [
      {
        week: {
          type: String,
          required: true,
        },
        progress: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        notes: {
          type: String,
          trim: true,
          default: '',
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
        },
        author: {
          type: String,
          required: true,
          trim: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Modelo de Goal para MongoDB
 * @class Goal
 * @extends mongoose.Model
 * @description Modelo que representa una meta en la base de datos
 */
const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
