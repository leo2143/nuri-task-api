import mongoose from 'mongoose';

/**
 * Mongoose Schema for the Achievement model (Global Template)
 * @typedef {Object} AchievementSchema
 * @property {string} title - Achievement title (required)
 * @property {string} description - Achievement description (required)
 * @property {number} targetCount - Target count to unlock/complete the achievement (required)
 * @property {string} reward - Achievement reward
 * @property {string} type - Achievement type (required) - Values: 'task', 'goal', 'metric', 'streak', 'comment'
 * @property {boolean} isActive - Whether the achievement is active (default: true)
 * @property {Date} createdAt - Creation timestamp (auto-generated)
 * @property {Date} updatedAt - Last update timestamp (auto-generated)
 */

/**
 * Achievement schema for MongoDB database
 * Defines the structure and validations for global achievement templates
 * Only admins can create, update, or delete achievements
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
 * Achievement Model for MongoDB (Global Templates)
 * @class Achievement
 * @extends mongoose.Model
 * @description Model representing a global achievement template in the database
 * These are managed by admins and serve as templates for all users
 * @example
 * const newAchievement = new Achievement({
 *   title: 'Primeros Pasos',
 *   description: 'Crea tu primera tarea',
 *   targetCount: 1,
 *   type: 'task',
 *   reward: 'Estrella de Bronce'
 * });
 */
const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
