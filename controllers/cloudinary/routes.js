import { CloudinaryController } from './cloudinaryController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de Cloudinary
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de Cloudinary en la app
 */
export const setupCloudinaryRoutes = app => {
  app.delete('/api/cloudinary/image', validateToken, (req, res) => {
    // #swagger.tags = ['Cloudinary']
    // #swagger.summary = 'Elimina una imagen de Cloudinary directamente (sin actualizar MongoDB)'
    // #swagger.description = 'Útil para limpiar imágenes huérfanas. Solo elimina de Cloudinary, no actualiza ningún documento.'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'URL de la imagen en Cloudinary a eliminar',
         required: true,
         schema: {
           imageUrl: 'https://res.cloudinary.com/example/image/upload/v1234567890/folder/image.jpg'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return CloudinaryController.deleteImage(req, res);
  });
};

