import { CloudinaryService } from '../../services/cloudinaryService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con Cloudinary
 */
export class CloudinaryController {
  /**
   * Elimina una imagen de Cloudinary directamente (sin actualizar MongoDB)
   * Útil para limpiar imágenes huérfanas
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.body - Datos de la imagen a eliminar
   * @param {string} req.body.imageUrl - URL de la imagen en Cloudinary
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async deleteImage(req, res) {
    try {
      const imageData = req.body;
      const result = await CloudinaryService.deleteImage(imageData);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en deleteImage:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}

