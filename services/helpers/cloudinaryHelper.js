import cloudinary from '../../config/cloudinary.js';

/**
 * Helper para operaciones con Cloudinary
 */
export class CloudinaryHelper {
  /**
   * Extrae el public_id de una URL de Cloudinary
   * @param {string} cloudinaryUrl - URL completa de la imagen en Cloudinary
   * @returns {string|null} - public_id extraído o null si no es válida
   * @example
   * // URL: https://res.cloudinary.com/dpyqoux1t/image/upload/v1234567890/folder/imagen.jpg
   * // Retorna: folder/imagen
   */
  static extractPublicId(cloudinaryUrl) {
    if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') {
      return null;
    }

    try {
      // Extraer la parte después de /upload/ y antes de la extensión
      // Soporta URLs con o sin versión (v1234567890)
      const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
      const match = cloudinaryUrl.match(regex);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extrayendo public_id:', error);
      return null;
    }
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param {string} imageUrl - URL completa de la imagen en Cloudinary
   * @returns {Promise<{success: boolean, result?: object, error?: string}>}
   */
  static async deleteImage(imageUrl) {
    const publicId = this.extractPublicId(imageUrl);

    if (!publicId) {
      return {
        success: false,
        error: 'No se pudo extraer el public_id de la URL',
      };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);

      // result.result será 'ok' si se eliminó, 'not found' si no existe
      if (result.result === 'ok') {
        console.log('Imagen eliminada de Cloudinary:', publicId);
        return { success: true, result };
      }

      // 'not found' no es un error crítico, la imagen ya no existe
      if (result.result === 'not found') {
        console.log('Imagen no encontrada en Cloudinary (ya eliminada):', publicId);
        return { success: true, result };
      }

      return {
        success: false,
        error: `Resultado inesperado de Cloudinary: ${result.result}`,
      };
    } catch (error) {
      console.error('Error eliminando imagen de Cloudinary:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar imagen de Cloudinary',
      };
    }
  }

  /**
   * Actualiza un campo de imagen y elimina la imagen antigua de Cloudinary
   * Sigue el patrón: actualizar en MongoDB PRIMERO, eliminar de Cloudinary DESPUÉS
   * @param {string} oldImageUrl - URL de la imagen antigua (puede ser null/undefined)
   * @param {string} newImageUrl - Nueva URL de la imagen
   * @param {Function} updateAndSaveFn - Función async que actualiza el campo y guarda el documento
   * @returns {Promise<Object>} Documento actualizado
   * @example
   * // Actualizar foto de perfil (campo directo)
   * const user = await User.findById(userId);
   * const oldUrl = user.profileImageUrl;
   * const updatedUser = await CloudinaryHelper.updateImageWithCleanup(
   *   oldUrl,
   *   newImageUrl,
   *   async () => {
   *     user.profileImageUrl = newImageUrl;
   *     return await user.save();
   *   }
   * );
   * @example
   * // Actualizar imagen en subdocumento (moodboard)
   * const oldUrl = image.imageUrl;
   * const updatedMoodboard = await CloudinaryHelper.updateImageWithCleanup(
   *   oldUrl,
   *   newImageUrl,
   *   async () => {
   *     image.imageUrl = newImageUrl;
   *     return await moodboard.save();
   *   }
   * );
   */
  static async updateImageWithCleanup(oldImageUrl, newImageUrl, updateAndSaveFn) {
    // Guardar en MongoDB PRIMERO (usando la función proporcionada)
    const updatedDocument = await updateAndSaveFn();

    // Eliminar la imagen antigua de Cloudinary DESPUÉS (si existía y cambió)
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      await this.deleteImage(oldImageUrl);
    }

    return updatedDocument;
  }
}

