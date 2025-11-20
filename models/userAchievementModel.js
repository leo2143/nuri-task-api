import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de UserAchievement (Progreso Individual)
 * @typedef {Object} UserAchievementSchema
 * @property {mongoose.Schema.Types.ObjectId} userId - ID del usuario (requerido)
 * @property {mongoose.Schema.Types.ObjectId} achievementId - ID de la plantilla del logro (requerido)
 * @property {number} currentCount - Conteo de progreso actual (default: 0)
 * @property {string} status - Estado del progreso - Valores: 'locked', 'unlocked', 'completed'
 * @property {Date} unlockedAt - Fecha en que se desbloqueó el logro
 * @property {Date} completedAt - Fecha en que se completó el logro
 * @property {Date} createdAt - Fecha de creación (automático)
 * @property {Date} updatedAt - Fecha de última actualización (automático)
 */

/**
 * Esquema de UserAchievement para la base de datos MongoDB
 * Define la estructura y validaciones para el progreso individual de usuarios en logros
 * @constant {mongoose.Schema} userAchievementSchema
 */
const userAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true,
    },
    currentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['locked', 'unlocked', 'completed'],
      default: 'locked',
    },
    unlockedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

userAchievementSchema.index({ userId: 1, status: 1 });

/**
 * Modelo de UserAchievement para MongoDB
 * @class UserAchievement
 * @extends mongoose.Model
 * @description Modelo que representa el progreso de un usuario en un logro
 */
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
export default UserAchievement;
