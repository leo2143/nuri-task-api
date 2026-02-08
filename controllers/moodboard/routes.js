import { MoodboardController } from './moodboardController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Configura las rutas del moodboard único del usuario
 * Cada usuario tiene exactamente un moodboard (relación 1:1)
 * @param {Object} app - Instancia de Express
 */
export const setupMoodboardRoutes = app => {
  // Obtener el moodboard del usuario
  app.get('/api/moodboard', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboard']
    // #swagger.summary = 'Obtiene el moodboard del usuario autenticado'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.getMoodboard(req, res);
  });

  // Actualizar el moodboard (imágenes en batch)
  app.put('/api/moodboard', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboard']
    // #swagger.summary = 'Actualiza el moodboard del usuario (imágenes en batch)'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos del moodboard a actualizar',
         required: true,
         schema: {
           images: [
             {
               imageUrl: 'https://example.com/image.jpg',
               imageAlt: 'Descripción',
               imagePositionNumber: 1
             }
           ]
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.updateMoodboard(req, res);
  });

  // Agregar una imagen al moodboard
  app.post('/api/moodboard/images', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboard']
    // #swagger.summary = 'Agrega una imagen al moodboard (máximo 6)'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos de la imagen',
         required: true,
         schema: {
           imageUrl: 'https://example.com/image.jpg',
           imageAlt: 'Descripción',
           imagePositionNumber: 1
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.addImage(req, res);
  });

  // Eliminar una imagen del moodboard
  app.delete('/api/moodboard/images/:imageId', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboard']
    // #swagger.summary = 'Elimina una imagen del moodboard'
    /* #swagger.parameters['imageId'] = {
         in: 'path',
         description: 'ID de la imagen',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.removeImage(req, res);
  });

  // Actualizar una imagen del moodboard
  app.put('/api/moodboard/images/:imageId', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboard']
    // #swagger.summary = 'Actualiza una imagen del moodboard'
    /* #swagger.parameters['imageId'] = {
         in: 'path',
         description: 'ID de la imagen',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos a actualizar de la imagen',
         required: true,
         schema: {
           imageUrl: 'https://example.com/new-image.jpg',
           imageAlt: 'Nueva descripción',
           imagePositionNumber: 2
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.updateImage(req, res);
  });

  // =========================================================================
  // COMENTADO: Funcionalidad de frases pendiente de definir
  // =========================================================================

  // // Agregar una frase al moodboard
  // app.post('/api/moodboard/phrases', validateToken, (req, res) => {
  //   // #swagger.tags = ['Moodboard']
  //   // #swagger.summary = 'Agrega una frase motivacional al moodboard'
  //   /* #swagger.parameters['body'] = {
  //        in: 'body',
  //        description: 'Datos de la frase',
  //        required: true,
  //        schema: {
  //          phrase: 'El éxito es la suma de pequeños esfuerzos'
  //        }
  //   } */
  //   /* #swagger.security = [{
  //        "bearerAuth": []
  //   }] */
  //   return MoodboardController.addPhrase(req, res);
  // });

  // // Eliminar una frase del moodboard
  // app.delete('/api/moodboard/phrases/:phraseId', validateToken, (req, res) => {
  //   // #swagger.tags = ['Moodboard']
  //   // #swagger.summary = 'Elimina una frase del moodboard'
  //   /* #swagger.parameters['phraseId'] = {
  //        in: 'path',
  //        description: 'ID de la frase',
  //        required: true,
  //        type: 'string'
  //   } */
  //   /* #swagger.security = [{
  //        "bearerAuth": []
  //   }] */
  //   return MoodboardController.removePhrase(req, res);
  // });

  // // Actualizar una frase del moodboard
  // app.put('/api/moodboard/phrases/:phraseId', validateToken, (req, res) => {
  //   // #swagger.tags = ['Moodboard']
  //   // #swagger.summary = 'Actualiza una frase del moodboard'
  //   /* #swagger.parameters['phraseId'] = {
  //        in: 'path',
  //        description: 'ID de la frase',
  //        required: true,
  //        type: 'string'
  //   } */
  //   /* #swagger.parameters['body'] = {
  //        in: 'body',
  //        description: 'Nueva frase',
  //        required: true,
  //        schema: {
  //          phrase: 'Cada día es una nueva oportunidad'
  //        }
  //   } */
  //   /* #swagger.security = [{
  //        "bearerAuth": []
  //   }] */
  //   return MoodboardController.updatePhrase(req, res);
  // });
};
