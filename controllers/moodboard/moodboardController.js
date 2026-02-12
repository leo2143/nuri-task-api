import { MoodboardService } from '../../services/moodboardService.js';

/**
 * Controlador para manejar las peticiones HTTP del moodboard único del usuario
 * Cada usuario tiene exactamente un moodboard (relación 1:1)
 */
export class MoodboardController {
  /**
   * Obtiene el moodboard único del usuario autenticado
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} res - Objeto response de Express
   */
  static async getMoodboard(req, res) {
    try {
      const userId = req.userId;
      const result = await MoodboardService.getMoodboard(userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getMoodboard:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Actualiza el moodboard del usuario (imágenes en batch)
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.body - Datos a actualizar
   * @param {Object} res - Objeto response de Express
   */
  static async updateMoodboard(req, res) {
    try {
      const moodboardData = req.body;
      const userId = req.userId;
      const result = await MoodboardService.updateMoodboard(moodboardData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en updateMoodboard:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Agrega una imagen al moodboard del usuario
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.body - Datos de la imagen
   * @param {string} req.body.imageUrl - URL de la imagen
   * @param {string} req.body.imageAlt - Texto alternativo
   * @param {number} req.body.imagePositionNumber - Posición de la imagen
   * @param {Object} res - Objeto response de Express
   */
  static async addImage(req, res) {
    try {
      const imageData = req.body;
      const userId = req.userId;
      const result = await MoodboardService.addImage(imageData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en addImage:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Elimina una imagen del moodboard del usuario
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.imageId - ID de la imagen
   * @param {Object} res - Objeto response de Express
   */
  static async removeImage(req, res) {
    try {
      const { imageId } = req.params;
      const userId = req.userId;
      const result = await MoodboardService.removeImage(imageId, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en removeImage:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Actualiza una imagen del moodboard del usuario
   * @param {Object} req - Objeto request de Express
   * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.imageId - ID de la imagen
   * @param {Object} req.body - Datos a actualizar de la imagen
   * @param {Object} res - Objeto response de Express
   */
  static async updateImage(req, res) {
    try {
      const { imageId } = req.params;
      const imageData = req.body;
      const userId = req.userId;
      const result = await MoodboardService.updateImage(imageId, imageData, userId);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en updateImage:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  // =========================================================================
  // COMENTADO: Funcionalidad de frases pendiente de definir
  // =========================================================================

  // /**
  //  * Agrega una frase al moodboard del usuario
  //  * @param {Object} req - Objeto request de Express
  //  * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
  //  * @param {Object} req.body - Datos de la frase
  //  * @param {string} req.body.phrase - Texto de la frase
  //  * @param {Object} res - Objeto response de Express
  //  */
  // static async addPhrase(req, res) {
  //   try {
  //     const phraseData = req.body;
  //     const userId = req.userId;
  //     const result = await MoodboardService.addPhrase(phraseData, userId);
  //     res.status(result.status).json(result);
  //   } catch (error) {
  //     console.error('Error en addPhrase:', error);
  //     res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
  //   }
  // }

  // /**
  //  * Elimina una frase del moodboard del usuario
  //  * @param {Object} req - Objeto request de Express
  //  * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
  //  * @param {Object} req.params - Parámetros de la URL
  //  * @param {string} req.params.phraseId - ID de la frase
  //  * @param {Object} res - Objeto response de Express
  //  */
  // static async removePhrase(req, res) {
  //   try {
  //     const { phraseId } = req.params;
  //     const userId = req.userId;
  //     const result = await MoodboardService.removePhrase(phraseId, userId);
  //     res.status(result.status).json(result);
  //   } catch (error) {
  //     console.error('Error en removePhrase:', error);
  //     res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
  //   }
  // }

  // /**
  //  * Actualiza una frase del moodboard del usuario
  //  * @param {Object} req - Objeto request de Express
  //  * @param {string} req.userId - ID del usuario (agregado por middleware de autenticación)
  //  * @param {Object} req.params - Parámetros de la URL
  //  * @param {string} req.params.phraseId - ID de la frase
  //  * @param {Object} req.body - Datos a actualizar de la frase
  //  * @param {string} req.body.phrase - Nuevo texto de la frase
  //  * @param {Object} res - Objeto response de Express
  //  */
  // static async updatePhrase(req, res) {
  //   try {
  //     const { phraseId } = req.params;
  //     const phraseData = req.body;
  //     const userId = req.userId;
  //     const result = await MoodboardService.updatePhrase(phraseId, phraseData, userId);
  //     res.status(result.status).json(result);
  //   } catch (error) {
  //     console.error('Error en updatePhrase:', error);
  //     res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
  //   }
  // }
}
