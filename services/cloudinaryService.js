import { CloudinaryHelper } from './helpers/cloudinaryHelper.js';
import { BadRequestResponseModel, ErrorResponseModel, SuccessResponseModel } from '../models/responseModel.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { DeleteCloudinaryImageDto } from '../models/dtos/users/DeleteCloudinaryImageDto.js';

/**
 * Servicio para manejar operaciones con Cloudinary
 */
export class CloudinaryService {
  /**
   * Elimina una imagen de Cloudinary directamente (sin actualizar MongoDB)
   * Útil para limpiar imágenes huérfanas
   * @param {Object} imageData - Datos de la imagen a eliminar
   * @param {string} imageData.imageUrl - URL de la imagen en Cloudinary
   * @returns {Promise<SuccessResponseModel|BadRequestResponseModel|ErrorResponseModel>}
   */
  static async deleteImage(imageData) {
    try {
      const deleteDto = new DeleteCloudinaryImageDto(imageData);
      const validation = deleteDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = deleteDto.toPlainObject();

      // Intentar eliminar de Cloudinary
      const deleteResult = await CloudinaryHelper.deleteImage(cleanData.imageUrl);

      if (!deleteResult.success) {
        return new BadRequestResponseModel(
          deleteResult.error || 'No se pudo eliminar la imagen de Cloudinary'
        );
      }

      return new SuccessResponseModel(
        {
          imageUrl: cleanData.imageUrl,
          deleted: deleteResult.result?.result === 'ok',
          message: deleteResult.result?.result === 'ok'
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

