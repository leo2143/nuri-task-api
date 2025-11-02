import mongoose from 'mongoose';

/**
 * Mongoose Schema for the UserAchievement model (Individual Progress)
 * @typedef {Object} UserAchievementSchema
 * @property {mongoose.Schema.Types.ObjectId} userId - User ID (required)
 * @property {mongoose.Schema.Types.ObjectId} achievementId - Achievement template ID (required)
 * @property {number} currentCount - Current progress count (default: 0)
 * @property {string} status - Progress status - Values: 'locked', 'unlocked', 'completed'
 * @property {Date} unlockedAt - Date when achievement was unlocked
 * @property {Date} completedAt - Date when achievement was completed
 * @property {Date} createdAt - Creation timestamp (auto-generated)
 * @property {Date} updatedAt - Last update timestamp (auto-generated)
 */

/**
 * UserAchievement schema for MongoDB database
 * Defines the structure and validations for individual user progress on achievements
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
 * UserAchievement Model for MongoDB
 * @class UserAchievement
 * @extends mongoose.Model
 * @description Model representing a user's progress on an achievement
 */
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
export default UserAchievement;
