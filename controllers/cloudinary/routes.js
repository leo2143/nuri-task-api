import { CloudinaryController } from './cloudinaryController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de Cloudinary
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de Cloudinary en la app
 */
export const setupCloudinaryRoutes = app => {
  app.post('/api/cloudinary/pending', validateToken, (req, res) => {
    // #swagger.tags = ['Cloudinary']
    // #swagger.summary = 'Registra una imagen recién subida para poder eliminarla como huérfana'
    // #swagger.description = 'La URL debe ser de este cloud. Expira en 1 hora. Necesario antes de DELETE si la imagen aún no está en perfil o moodboard.'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'URL de la imagen en Cloudinary',
         required: true,
         schema: {
           imageUrl: 'https://res.cloudinary.com/example/image/upload/v1234567890/folder/image.jpg'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return CloudinaryController.registerPendingImage(req, res);
  });

  app.delete('/api/cloudinary/image', validateToken, (req, res) => {
    // #swagger.tags = ['Cloudinary']
    // #swagger.summary = 'Elimina una imagen de Cloudinary del usuario autenticado'
    // #swagger.description = 'Solo borra si la URL es de este cloud y pertenece al usuario: foto de perfil, imagen de moodboard, o pending registrado.'
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
