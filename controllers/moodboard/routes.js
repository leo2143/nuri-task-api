import { MoodboardController } from './moodboardController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de moodboards
 * @function setupMoodboardRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de moodboards en la app
 * @description Configura las rutas de moodboards protegidas con autenticación JWT
 */
export const setupMoodboardRoutes = app => {
  app.get('/api/moodboards', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Obtiene todos los moodboards del usuario'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.getAllMoodboards(req, res);
  });

  app.get('/api/moodboards/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Obtiene un moodboard por su ID'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del moodboard',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.getMoodboardById(req, res);
  });

  app.post('/api/moodboards', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Crea un nuevo moodboard'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos del moodboard',
         required: true,
         schema: {
           title: 'Metas 2025',
           images: [],
           phrases: []
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.createMoodboard(req, res);
  });

  app.put('/api/moodboards/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Actualiza un moodboard existente'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del moodboard',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.updateMoodboard(req, res);
  });

  app.delete('/api/moodboards/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Elimina un moodboard'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del moodboard',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.deleteMoodboard(req, res);
  });

  app.post('/api/moodboards/:id/images', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Agrega una imagen al moodboard (máximo 6)'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del moodboard',
         required: true,
         type: 'string'
    } */
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

  app.delete('/api/moodboards/:id/images/:imageId', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Elimina una imagen del moodboard'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del moodboard',
         required: true,
         type: 'string'
    } */
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

  app.put('/api/moodboards/:id/images/:imageId', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Actualiza una imagen del moodboard'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del moodboard',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['imageId'] = {
         in: 'path',
         description: 'ID de la imagen',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.updateImage(req, res);
  });

  app.post('/api/moodboards/:id/phrases', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Agrega una frase motivacional al moodboard'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del moodboard',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos de la frase',
         required: true,
         schema: {
           phrase: 'El éxito es la suma de pequeños esfuerzos'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.addPhrase(req, res);
  });

  app.delete('/api/moodboards/:id/phrases/:phraseId', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Elimina una frase del moodboard'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del moodboard',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['phraseId'] = {
         in: 'path',
         description: 'ID de la frase',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.removePhrase(req, res);
  });

  app.put('/api/moodboards/:id/phrases/:phraseId', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Actualiza una frase del moodboard'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del moodboard',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['phraseId'] = {
         in: 'path',
         description: 'ID de la frase',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Nueva frase',
         required: true,
         schema: {
           phrase: 'Cada día es una nueva oportunidad'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.updatePhrase(req, res);
  });

  app.get('/api/moodboards/search', validateToken, (req, res) => {
    // #swagger.tags = ['Moodboards']
    // #swagger.summary = 'Busca moodboards por título'
    /* #swagger.parameters['title'] = {
         in: 'query',
         description: 'Término de búsqueda',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return MoodboardController.searchByTitle(req, res);
  });
};
