import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Todo
 * @typedef {Object} TodoSchema
 * @property {string} title - Título de la tarea (requerido)
 * @property {string} description - Descripción de la tarea
 * @property {boolean} completed - Estado de completado de la tarea
 * @property {mongoose.Types.ObjectId} userId - ID del usuario propietario (requerido)
 * @property {string} priority - Prioridad de la tarea (low/medium/high)
 * @property {Date} dueDate - Fecha límite de la tarea
 * @property {Date} createdAt - Fecha de creación (automático)
 * @property {Date} updatedAt - Fecha de última actualización (automático)
 */

/**
 * Esquema de tarea (todo) para la base de datos MongoDB
 * Define la estructura y validaciones para los documentos de tareas
 * @constant {mongoose.Schema} todoSchema
 */
const todoSchema = new mongoose.Schema(
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
    completed: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    GoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
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
  },
  {
    timestamps: true,
  }
);

/**
 * Modelo de Todo para MongoDB
 * @class Todo
 * @extends mongoose.Model
 * @description Modelo que representa una tarea en la base de datos
 * @example
 * // Crear una nueva tarea
 * const todo = new Todo({
 *   title: 'Aprender Node.js',
 *   description: 'Estudiar conceptos básicos',
 *   priority: 'high',
 *   userId: '64f8a1b2c3d4e5f6a7b8c9d0'
 * });
 * await todo.save();
 */
const Todo = mongoose.model('Todo', todoSchema);
export default Todo;
