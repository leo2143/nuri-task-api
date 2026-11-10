import mongoose from 'mongoose';
import { ACHIEVEMENT_TRIGGER_EVENTS, ACHIEVEMENT_TYPES } from './achievementCatalog.js';

/**
 * Esquema de Mongoose para el modelo de Achievement (Plantilla Global)
 * @typedef {Object} AchievementSchema
 * @property {string} title - Título del logro (requerido)
 * @property {string} description - Descripción del logro (requerido)
 * @property {number} targetCount - Conteo objetivo para desbloquear/completar el logro (requerido)
 * @property {string} type - Tipo de logro (requerido) - Valores: 'task', 'goal', 'metric', 'streak'
 * @property {string} triggerEvent - Evento que dispara el progreso del logro (requerido, ver achievementCatalog.js)
 * @property {Object} conditions - Condiciones que el evento debe cumplir para sumar progreso (editables por el admin)
 * @property {Object} [conditions.timeWindow] - Franja horaria local `{start, end}` en `HH:mm`; el fin no se incluye y start > end cruza la medianoche
 * @property {boolean} [conditions.sameWindow] - El progreso cuenta solo eventos de la misma franja (o del mismo día local sin franja)
 * @property {number} [conditions.maxDurationHours] - Horas máximas entre la creación de la meta y su primer cierre
 * @property {string} tier - Nivel de acceso del logro: 'basic' (todos) o 'premium' (solo suscriptores)
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
const timeWindowSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const conditionsSchema = new mongoose.Schema(
  {
    timeWindow: { type: timeWindowSchema, default: undefined },
    sameWindow: { type: Boolean, default: undefined },
    maxDurationHours: { type: Number, min: 0, default: undefined },
  },
  { _id: false }
);

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
    type: {
      type: String,
      required: true,
      enum: ACHIEVEMENT_TYPES,
    },
    triggerEvent: {
      type: String,
      required: true,
      enum: ACHIEVEMENT_TRIGGER_EVENTS,
    },
    conditions: {
      type: conditionsSchema,
      default: () => ({}),
    },
    tier: {
      type: String,
      enum: ['basic', 'premium'],
      default: 'basic',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    reward: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

achievementSchema.index({ triggerEvent: 1, isActive: 1 });

/**
 * Modelo de Achievement para MongoDB (Plantillas Globales)
 * @class Achievement
 * @extends mongoose.Model
 * @description Modelo que representa una plantilla global de logro en la base de datos
 * Son administrados por administradores y sirven como plantillas para todos los usuarios
 */
const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
