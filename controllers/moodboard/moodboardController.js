import { MoodboardService } from '../../services/moodboardService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con moodboards
 */
export class MoodboardController {
  /**
   * Obtiene todos los moodboards del usuario autenticado
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllMoodboards(req, res) {
    try {
      const userId = req.userId;
      const result = await MoodboardService.getAllMoodboards(userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getAllMoodboards:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Obtiene un moodboard específico por ID
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del moodboard
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getMoodboardById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const result = await MoodboardService.getMoodboardById(id, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getMoodboardById:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Crea un nuevo moodboard
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.body - Datos del moodboard
   * @param {string} req.body.title - Título del moodboard (requerido)
   * @param {Array} [req.body.images] - Array de imágenes
   * @param {Array} [req.body.phrases] - Array de frases
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async createMoodboard(req, res) {
    try {
      const moodboardData = req.body;
      const userId = req.userId;
      const result = await MoodboardService.createMoodboard(moodboardData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en createMoodboard:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Actualiza un moodboard existente
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del moodboard
   * @param {Object} req.body - Datos a actualizar
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updateMoodboard(req, res) {
    try {
      const { id } = req.params;
      const moodboardData = req.body;
      const userId = req.userId;
      const result = await MoodboardService.updateMoodboard(id, moodboardData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en updateMoodboard:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina un moodboard
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del moodboard
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async deleteMoodboard(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const result = await MoodboardService.deleteMoodboard(id, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en deleteMoodboard:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Agrega una imagen a un moodboard
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del moodboard
   * @param {Object} req.body - Datos de la imagen
   * @param {string} req.body.imageUrl - URL de la imagen
   * @param {string} req.body.imageAlt - Texto alternativo
   * @param {number} req.body.imagePositionNumber - Posición de la imagen
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async addImage(req, res) {
    try {
      const { id } = req.params;
      const imageData = req.body;
      const userId = req.userId;
      const result = await MoodboardService.addImage(id, imageData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en addImage:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina una imagen de un moodboard
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del moodboard
   * @param {string} req.params.imageId - ID de la imagen
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async removeImage(req, res) {
    try {
      const { id, imageId } = req.params;
      const userId = req.userId;
      const result = await MoodboardService.removeImage(id, imageId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en removeImage:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Actualiza una imagen de un moodboard
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del moodboard
   * @param {string} req.params.imageId - ID de la imagen
   * @param {Object} req.body - Datos a actualizar de la imagen
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updateImage(req, res) {
    try {
      const { id, imageId } = req.params;
      const imageData = req.body;
      const userId = req.userId;
      const result = await MoodboardService.updateImage(id, imageId, imageData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en updateImage:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Agrega una frase a un moodboard
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del moodboard
   * @param {Object} req.body - Datos de la frase
   * @param {string} req.body.phrase - Texto de la frase
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async addPhrase(req, res) {
    try {
      const { id } = req.params;
      const phraseData = req.body;
      const userId = req.userId;
      const result = await MoodboardService.addPhrase(id, phraseData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en addPhrase:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina una frase de un moodboard
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del moodboard
   * @param {string} req.params.phraseId - ID de la frase
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async removePhrase(req, res) {
    try {
      const { id, phraseId } = req.params;
      const userId = req.userId;
      const result = await MoodboardService.removePhrase(id, phraseId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en removePhrase:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Actualiza una frase de un moodboard
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del moodboard
   * @param {string} req.params.phraseId - ID de la frase
   * @param {Object} req.body - Datos a actualizar de la frase
   * @param {string} req.body.phrase - Nuevo texto de la frase
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async updatePhrase(req, res) {
    try {
      const { id, phraseId } = req.params;
      const phraseData = req.body;
      const userId = req.userId;
      const result = await MoodboardService.updatePhrase(id, phraseId, phraseData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en updatePhrase:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Busca moodboards por título
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.query - Query parameters
   * @param {string} req.query.title - Término de búsqueda
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async searchByTitle(req, res) {
    try {
      const { title } = req.query;
      const userId = req.userId;
      const result = await MoodboardService.searchByTitle(title, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en searchByTitle:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}
