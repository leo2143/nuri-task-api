import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Usuario
 * @typedef {Object} UserSchema
 * @property {string} name - Nombre del usuario (requerido)
 * @property {string} email - Email del usuario (requerido, único)
 * @property {string} password - Contraseña hasheada del usuario (requerido)
 * @property {boolean} isAdmin - Indica si el usuario es administrador (default: false)
 */

/**
 * Esquema de usuario para la base de datos MongoDB
 * Define la estructura y validaciones para los documentos de usuario
 * @constant {mongoose.Schema} userSchema
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  subscription: {
    isActive: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  profileImageUrl: {
    type: String,
    default: null,
  },
});

/**
 * Modelo de Usuario para MongoDB
 * @class User
 * @extends mongoose.Model
 * @description Modelo que representa un usuario en la base de datos
 */
const User = mongoose.model('User', userSchema);
export default User;
