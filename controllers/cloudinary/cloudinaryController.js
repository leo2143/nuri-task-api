import { CloudinaryService } from '../../services/cloudinaryService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con Cloudinary
 */
export class CloudinaryController {
  /**
   * Registra una imagen recién subida para poder borrarla como huérfana.
   */
  static async registerPendingImage(req, res) {
    try {
      const result = await CloudinaryService.registerPendingImage(req.body, req.userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en registerPendingImage:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina una imagen de Cloudinary si pertenece al usuario autenticado.
   */
  static async deleteImage(req, res) {
    try {
      const result = await CloudinaryService.deleteImage(req.body, req.userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en deleteImage:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}
