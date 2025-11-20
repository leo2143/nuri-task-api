import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Achievement (Plantilla Global)
 * @typedef {Object} AchievementSchema
 * @property {string} title - Título del logro (requerido)
 * @property {string} description - Descripción del logro (requerido)
 * @property {number} targetCount - Conteo objetivo para desbloquear/completar el logro (requerido)
 * @property {string} reward - Recompensa del logro
 * @property {string} type - Tipo de logro (requerido) - Valores: 'task', 'goal', 'metric', 'streak', 'comment'
 * @property {boolean} isActive - Si el logro está activo (default: true)
 * @property {Date} createdAt - Fecha de creación (automático)
 * @property {Date} updatedAt - Fecha de última actualización (automático)
 */

/**
 * Esquema de logro para la base de datos MongoDB
 * Define la estructura y validaciones para las plantillas globales de logros
 * Solo los administradores pueden crear, actualizar o eliminar logros
 * @constant {mongoose.Schema} achievementSchema
 */
const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    targetCount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    reward: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: ['task', 'goal', 'metric', 'streak', 'comment'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Modelo de Achievement para MongoDB (Plantillas Globales)
 * @class Achievement
 * @extends mongoose.Model
 * @description Modelo que representa una plantilla global de logro en la base de datos
 * Son administrados por administradores y sirven como plantillas para todos los usuarios
 */
const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
