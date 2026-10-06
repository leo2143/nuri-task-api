import mongoose from 'mongoose';

const PENDING_IMAGE_TTL_SECONDS = 3600;

/**
 * Imagen recién subida a Cloudinary que todavía no se persistió en perfil/moodboard.
 * Permite borrar huérfanos sin abrir el delete a cualquier URL.
 */
const pendingCloudinaryImageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true,
  },
  publicId: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: PENDING_IMAGE_TTL_SECONDS,
  },
});

const PendingCloudinaryImage = mongoose.model('PendingCloudinaryImage', pendingCloudinaryImageSchema);
export default PendingCloudinaryImage;
