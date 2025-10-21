import { MoodboardController } from './moodboardController.js';
import { validarToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de moodboards
 * @function setupMoodboardRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de moodboards en la app
 * @description Configura las rutas de moodboards protegidas con autenticación JWT
 */
export const setupMoodboardRoutes = app => {
  // ==================== RUTAS CRUD BÁSICAS ====================

  /**
   * @route GET /api/moodboards
   * @description Obtiene todos los moodboards del usuario autenticado
   * @access Privado (requiere token JWT)
   */
  app.get('/api/moodboards', validarToken, MoodboardController.getAllMoodboards);

  /**
   * @route GET /api/moodboards/:id
   * @description Obtiene un moodboard específico por ID
   * @access Privado (requiere token JWT)
   */
  app.get('/api/moodboards/:id', validarToken, MoodboardController.getMoodboardById);

  /**
   * @route POST /api/moodboards
   * @description Crea un nuevo moodboard
   * @access Privado (requiere token JWT)
   * @body {string} title - Título del moodboard (requerido)
   * @body {Array} [images] - Array de imágenes
   * @body {Array} [phrases] - Array de frases
   */
  app.post('/api/moodboards', validarToken, MoodboardController.createMoodboard);

  /**
   * @route PUT /api/moodboards/:id
   * @description Actualiza un moodboard existente
   * @access Privado (requiere token JWT)
   */
  app.put('/api/moodboards/:id', validarToken, MoodboardController.updateMoodboard);

  /**
   * @route DELETE /api/moodboards/:id
   * @description Elimina un moodboard
   * @access Privado (requiere token JWT)
   */
  app.delete('/api/moodboards/:id', validarToken, MoodboardController.deleteMoodboard);

  // ==================== RUTAS PARA IMÁGENES ====================

  /**
   * @route POST /api/moodboards/:id/images
   * @description Agrega una imagen al moodboard (máximo 6 imágenes)
   * @access Privado (requiere token JWT)
   * @body {string} imageUrl - URL de la imagen
   * @body {string} imageAlt - Texto alternativo
   * @body {number} imagePositionNumber - Posición de la imagen
   */
  app.post('/api/moodboards/:id/images', validarToken, MoodboardController.addImage);

  /**
   * @route DELETE /api/moodboards/:id/images/:imageId
   * @description Elimina una imagen del moodboard
   * @access Privado (requiere token JWT)
   */
  app.delete('/api/moodboards/:id/images/:imageId', validarToken, MoodboardController.removeImage);

  /**
   * @route PUT /api/moodboards/:id/images/:imageId
   * @description Actualiza una imagen del moodboard
   * @access Privado (requiere token JWT)
   */
  app.put('/api/moodboards/:id/images/:imageId', validarToken, MoodboardController.updateImage);

  // ==================== RUTAS PARA FRASES ====================

  /**
   * @route POST /api/moodboards/:id/phrases
   * @description Agrega una frase al moodboard
   * @access Privado (requiere token JWT)
   * @body {string} phrase - Texto de la frase
   */
  app.post('/api/moodboards/:id/phrases', validarToken, MoodboardController.addPhrase);

  /**
   * @route DELETE /api/moodboards/:id/phrases/:phraseId
   * @description Elimina una frase del moodboard
   * @access Privado (requiere token JWT)
   */
  app.delete('/api/moodboards/:id/phrases/:phraseId', validarToken, MoodboardController.removePhrase);

  /**
   * @route PUT /api/moodboards/:id/phrases/:phraseId
   * @description Actualiza una frase del moodboard
   * @access Privado (requiere token JWT)
   * @body {string} phrase - Nuevo texto de la frase
   */
  app.put('/api/moodboards/:id/phrases/:phraseId', validarToken, MoodboardController.updatePhrase);

  // ==================== RUTAS DE BÚSQUEDA ====================

  /**
   * @route GET /api/moodboards/search
   * @description Busca moodboards por título
   * @access Privado (requiere token JWT)
   * @query {string} title - Término de búsqueda
   */
  app.get('/api/moodboards/search', validarToken, MoodboardController.searchByTitle);
};
