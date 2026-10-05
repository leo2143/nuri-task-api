import User from '../models/userModel.js';
import Moodboard from '../models/moodboardModel.js';
import Achievement from '../models/achievementModel.js';
import PendingCloudinaryImage from '../models/pendingCloudinaryImageModel.js';
import { CloudinaryHelper } from './helpers/cloudinaryHelper.js';
import {
  BadRequestResponseModel,
  ForbiddenResponseModel,
  SuccessResponseModel,
  CreatedResponseModel,
} from '../models/responseModel.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { DeleteCloudinaryImageDto } from '../models/dtos/users/DeleteCloudinaryImageDto.js';

/**
 * Servicio para manejar operaciones con Cloudinary
 */
export class CloudinaryService {
  /**
   * Parsea el DTO y extrae el public_id. Devuelve error de validación o los datos limpios.
   * @returns {{ cleanData: { imageUrl: string }, publicId: string } | BadRequestResponseModel}
   */
  static _parseImagePayload(imageData) {
    const deleteDto = new DeleteCloudinaryImageDto(imageData);
    const validation = deleteDto.validate();

    if (!validation.isValid) {
      return new BadRequestResponseModel(validation.errors.join(', '));
    }

    const cleanData = deleteDto.toPlainObject();
    const publicId = CloudinaryHelper.extractPublicId(cleanData.imageUrl);

    if (!publicId) {
      return new BadRequestResponseModel('No se pudo extraer el public_id de la URL');
    }

    return { cleanData, publicId };
  }

  /**
   * La URL ya está referenciada por otro usuario, un moodboard ajeno o un logro.
   */
  static async _isReferencedByOthers(imageUrl, userId) {
    const [otherUser, otherMoodboard, achievement] = await Promise.all([
      User.exists({ profileImageUrl: imageUrl, _id: { $ne: userId } }),
      Moodboard.exists({ 'images.imageUrl': imageUrl, userId: { $ne: userId } }),
      Achievement.exists({ imageUrl }),
    ]);

    return Boolean(otherUser || otherMoodboard || achievement);
  }

  /**
   * El usuario puede borrar si es su pending, su foto de perfil o una imagen de su moodboard.
   */
  static async _canDeleteImage(imageUrl, publicId, userId) {
    const pending = await PendingCloudinaryImage.exists({ userId, publicId });
    if (pending) {
      return true;
    }

    const [ownProfile, ownMoodboard] = await Promise.all([
      User.exists({ _id: userId, profileImageUrl: imageUrl }),
      Moodboard.exists({ userId, 'images.imageUrl': imageUrl }),
    ]);

    return Boolean(ownProfile || ownMoodboard);
  }

  /**
   * Registra una URL recién subida para poder borrarla como huérfana.
   * @param {Object} imageData
   * @param {string} imageData.imageUrl
   * @param {string} userId
   */
  static async registerPendingImage(imageData, userId) {
    try {
      const parsed = this._parseImagePayload(imageData);
      if (parsed instanceof BadRequestResponseModel) {
        return parsed;
      }

      const { cleanData, publicId } = parsed;

      if (await this._isReferencedByOthers(cleanData.imageUrl, userId)) {
        return new ForbiddenResponseModel('No se puede registrar una imagen que no pertenece al usuario');
      }

      await PendingCloudinaryImage.findOneAndUpdate(
        { userId, publicId },
        { userId, publicId, imageUrl: cleanData.imageUrl, createdAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return new CreatedResponseModel({ imageUrl: cleanData.imageUrl }, 'Imagen pendiente registrada');
    } catch (error) {
      if (error.code === 11000) {
        return new ForbiddenResponseModel('No se puede registrar una imagen que no pertenece al usuario');
      }
      return ErrorHandler.handleDatabaseError(error, 'registrar imagen pendiente de Cloudinary');
    }
  }

  /**
   * Elimina una imagen de Cloudinary si pertenece al usuario (perfil, moodboard o pending).
   * @param {Object} imageData
   * @param {string} imageData.imageUrl
   * @param {string} userId
   */
  static async deleteImage(imageData, userId) {
    try {
      const parsed = this._parseImagePayload(imageData);
      if (parsed instanceof BadRequestResponseModel) {
        return parsed;
      }

      const { cleanData, publicId } = parsed;

      const allowed = await this._canDeleteImage(cleanData.imageUrl, publicId, userId);
      if (!allowed) {
        return new ForbiddenResponseModel('No se puede eliminar una imagen que no pertenece al usuario');
      }

      const deleteResult = await CloudinaryHelper.deleteImage(cleanData.imageUrl);

      if (!deleteResult.success) {
        return new BadRequestResponseModel(
          deleteResult.error || 'No se pudo eliminar la imagen de Cloudinary'
        );
      }

      await PendingCloudinaryImage.deleteOne({ userId, publicId });

      return new SuccessResponseModel(
        {
          imageUrl: cleanData.imageUrl,
          deleted: deleteResult.result?.result === 'ok',
          message:
            deleteResult.result?.result === 'ok'
              ? 'Imagen eliminada correctamente de Cloudinary'
              : 'Imagen no encontrada en Cloudinary (ya estaba eliminada)',
        },
        'Operación completada'
      );
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar imagen de Cloudinary');
    }
  }
}
