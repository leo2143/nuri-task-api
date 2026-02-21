import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Goal
 * @typedef {Object} GoalSchema
 * @property {string} title - Título de la meta (requerido)
 * @property {string} description - Descripción de la meta
 * @property {string} reason - Razón de importancia de la meta
 * @property {string} status - Estado de la meta (active/paused/completed)
 * @property {string} priority - Prioridad de la meta (low/medium/high)
 * @property {Date} dueDate - Fecha límite de la meta
 * @property {mongoose.Types.ObjectId} parentGoalId - ID de la meta padre (para submetas)
 * @property {number} totalSubGoals - Total de submetas
 * @property {number} completedSubGoals - Submetas completadas
 * @property {number} totalTasks - Total de tareas
 * @property {number} completedTasks - Tareas completadas
 * @property {number} progress - Progreso de la meta (0-100)
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
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    parentGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    totalSubGoals: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedSubGoals: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
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

// ========== MÉTODOS DEL ESQUEMA ==========

/**
 * Actualiza los contadores de tareas y recalcula el progreso
 * Debe llamarse cuando se agregan, completan o eliminan tareas asociadas
 * @method updateTaskCount
 * @returns {Promise<void>}
 */
goalSchema.methods.updateTaskCount = async function () {
  const Todo = mongoose.model('Todo');
  const tasks = await Todo.find({ GoalId: this._id });

  this.totalTasks = tasks.length;
  this.completedTasks = tasks.filter(t => t.completed).length;
  this.progress = this.calculatedProgress;
};

/**
 * Actualiza los contadores de submetas
 * Debe llamarse cuando se completa o elimina una submeta
 * @method updateSubGoalCount
 * @returns {Promise<void>}
 */
goalSchema.methods.updateSubGoalCount = async function () {
  const Goal = mongoose.model('Goal');
  const subGoals = await Goal.find({ parentGoalId: this._id });

  this.totalSubGoals = subGoals.length;
  this.completedSubGoals = subGoals.filter(g => g.status === 'completed').length;
};

/**
 * Calcula el progreso basado en tareas completadas
 * @virtual calculatedProgress
 * @returns {number} Progreso de 0 a 100
 */
goalSchema.virtual('calculatedProgress').get(function () {
  if (this.totalTasks === 0) return 0;
  return Math.round((this.completedTasks / this.totalTasks) * 100);
});

goalSchema.set('toJSON', { versionKey: false });
goalSchema.set('toObject', { versionKey: false });

/**
 * Modelo de Goal para MongoDB
 * @class Goal
 * @extends mongoose.Model
 * @description Modelo que representa una meta en la base de datos
 */
const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
