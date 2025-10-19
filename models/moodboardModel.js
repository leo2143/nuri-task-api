import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Moodboard
 * @typedef {Object} MoodboardSchema
 * @property {string} title - Título del moodboard (requerido)
 * @property {mongoose.Types.ObjectId} userId - ID del usuario propietario (requerido)
 * @property {Array} images - Array de imágenes del moodboard
 * @property {string} images.imageUrl - URL de la imagen (requerido)
 * @property {string} images.imageAlt - Texto alternativo de la imagen (requerido)
 * @property {number} images.imagePositionNumber - Posición de la imagen en el moodboard (requerido)
 * @property {Array} phrases - Array de frases inspiradoras del moodboard
 * @property {string} phrases.phrase - Texto de la frase (requerido)
 * @property {Date} createdAt - Fecha de creación (automático)
 * @property {Date} updatedAt - Fecha de última actualización (automático)
 */

/**
 * Esquema de moodboard para la base de datos MongoDB
 * Define la estructura y validaciones para los documentos de moodboard
 * @constant {mongoose.Schema} moodboardSchema
 */
const moodboardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    images: [
      {
        imageUrl: {
          type: String,
          required: true,
          trim: true,
        },
        imageAlt: {
          type: String,
          required: true,
          trim: true,
        },
        imagePositionNumber: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    phrases: [
      {
        phrase: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Modelo de Moodboard para MongoDB
 * @class Moodboard
 * @extends mongoose.Model
 * @description Modelo que representa un moodboard en la base de datos
 * @example
 * // Crear un nuevo moodboard
 * const moodboard = new Moodboard({
 *   title: 'Mi Moodboard de Inspiración',
 *   userId: '68d2cf072897f6a7a500a4b5',
 *   images: [
 *     {
 *       imageUrl: 'https://example.com/image1.jpg',
 *       imageAlt: 'Imagen inspiradora 1',
 *       imagePositionNumber: 1
 *     }
 *   ],
 *   phrases: [
 *     { phrase: 'Nunca te rindas' },
 *     { phrase: 'Sigue adelante' }
 *   ]
 * });
 */
const Moodboard = mongoose.model('Moodboard', moodboardSchema);
export default Moodboard;
