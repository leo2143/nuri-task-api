import mongoose from 'mongoose';

/**
 * Esquema de Mongoose para el modelo de Moodboard
 * Cada usuario tiene exactamente un moodboard (relación 1:1)
 * @typedef {Object} MoodboardSchema
 * @property {mongoose.Types.ObjectId} userId - ID del usuario propietario (requerido, único)
 * @property {Array} images - Array de imágenes del moodboard
 * @property {string} images.imageUrl - URL de la imagen (requerido)
 * @property {string} images.imageAlt - Texto alternativo de la imagen (requerido)
 * @property {number} images.imagePositionNumber - Posición de la imagen en el moodboard (requerido)
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Garantiza 1 moodboard por usuario
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
    // COMENTADO: Funcionalidad de frases pendiente de definir
    // phrases: [
    //   {
    //     phrase: {
    //       type: String,
    //       trim: true,
    //     },
    //   },
    // ],
  },
  {
    timestamps: true,
  }
);

/**
 * Modelo de Moodboard para MongoDB
 * @description Modelo que representa el moodboard único de un usuario
 */
const Moodboard = mongoose.model('Moodboard', moodboardSchema);
export default Moodboard;
