import Moodboard from '../models/moodboardModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import { UpdateMoodboardDto, AddImageDto } from '../models/dtos/moodboard/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import { CloudinaryHelper } from './helpers/cloudinaryHelper.js';

/**
 * Servicio para manejar la lógica de negocio del moodboard único del usuario
 * Cada usuario tiene exactamente un moodboard (relación 1:1)
 */
export class MoodboardService {
  /**
   * Busca el moodboard único del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<{moodboard: Object|null, error: NotFoundResponseModel|null}>}
   * @private
   */
  static async _findMoodboardByUser(userId) {
    const moodboard = await Moodboard.findOne({ userId });

    if (!moodboard) {
      return { moodboard: null, error: new NotFoundResponseModel('Moodboard no encontrado') };
    }

    return { moodboard, error: null };
  }

  /**
   * Obtiene el moodboard único del usuario autenticado
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   */
  static async getMoodboard(userId) {
    try {
      const moodboard = await Moodboard.findOne({ userId });

      if (!moodboard) {
        return new NotFoundResponseModel('Moodboard no encontrado');
      }

      return new SuccessResponseModel(moodboard, 'Moodboard obtenido correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener moodboard');
    }
  }

  /**
   * Crea el moodboard inicial para un usuario recién registrado
   * Método interno, se llama automáticamente al registrar usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>}
   */
  static async createMoodboardForUser(userId) {
    try {
      const moodboard = new Moodboard({
        userId,
        images: [],
      });

      const savedMoodboard = await moodboard.save();
      return new CreatedResponseModel(savedMoodboard, 'Moodboard creado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'crear moodboard');
    }
  }

  /**
   * Actualiza el moodboard del usuario (imágenes en batch)
   * @param {Object} moodboardData - Datos a actualizar
   * @param {Array} [moodboardData.images] - Array de imágenes
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   */
  static async updateMoodboard(moodboardData, userId) {
    try {
      const updateDto = new UpdateMoodboardDto(moodboardData);
      const validation = updateDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = updateDto.toPlainObject();
      const moodboard = await Moodboard.findOneAndUpdate({ userId }, cleanData, {
        new: true,
        runValidators: true,
      });

      if (!moodboard) {
        return new NotFoundResponseModel('Moodboard no encontrado');
      }

      return new SuccessResponseModel(moodboard, 'Moodboard actualizado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar moodboard');
    }
  }

  /**
   * Agrega una imagen al moodboard del usuario
   * @param {Object} imageData - Datos de la imagen
   * @param {string} imageData.imageUrl - URL de la imagen (requerido)
   * @param {string} imageData.imageAlt - Texto alternativo (requerido)
   * @param {number} imageData.imagePositionNumber - Posición de la imagen (requerido)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   */
  static async addImage(imageData, userId) {
    try {
      const addImageDto = new AddImageDto(imageData);
      const validation = addImageDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { moodboard: existingMoodboard, error } = await this._findMoodboardByUser(userId);
      if (error) return error;

      const cleanImage = addImageDto.toPlainObject();
      const moodboard = await Moodboard.findOneAndUpdate(
        { userId },
        { $push: { images: cleanImage } },
        { new: true, runValidators: true }
      );

      return new SuccessResponseModel(moodboard, 'Imagen agregada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'agregar imagen');
    }
  }

  /**
   * Elimina una imagen del moodboard del usuario
   * @param {string} imageId - ID de la imagen a eliminar
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   */
  static async removeImage(imageId, userId) {
    try {
      // Buscar el moodboard y la imagen antes de eliminar
      const { moodboard: existingMoodboard, error } = await this._findMoodboardByUser(userId);
      if (error) return error;

      const imageToDelete = existingMoodboard.images.id(imageId);
      if (!imageToDelete) {
        return new NotFoundResponseModel('Imagen no encontrada en el moodboard');
      }

      // Guardar la URL antes de eliminar
      const imageUrl = imageToDelete.imageUrl;

      // Eliminar de MongoDB PRIMERO
      const moodboard = await Moodboard.findOneAndUpdate(
        { userId },
        {
          $pull: {
            images: { _id: imageId },
          },
        },
        { new: true }
      );

      if (!moodboard) {
        return new NotFoundResponseModel('Moodboard no encontrado');
      }

      // Eliminar de Cloudinary DESPUÉS (si falla, solo queda imagen huérfana)
      await CloudinaryHelper.deleteImage(imageUrl);

      return new SuccessResponseModel(moodboard, 'Imagen eliminada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar imagen');
    }
  }

  /**
   * Actualiza una imagen específica del moodboard del usuario
   * @param {string} imageId - ID de la imagen a actualizar
   * @param {Object} imageData - Datos de la imagen a actualizar
   * @param {string} [imageData.imageUrl] - URL de la imagen
   * @param {string} [imageData.imageAlt] - Texto alternativo
   * @param {number} [imageData.imagePositionNumber] - Posición de la imagen
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   */
  static async updateImage(imageId, imageData, userId) {
    try {
      const { moodboard, error } = await this._findMoodboardByUser(userId);
      if (error) return error;

      const image = moodboard.images.id(imageId);
      if (!image) {
        return new NotFoundResponseModel('Imagen no encontrada');
      }

      // Guardar la URL antigua si se va a cambiar
      const oldImageUrl = imageData.imageUrl !== undefined && imageData.imageUrl !== image.imageUrl ? image.imageUrl : null;

      // Actualizar campos en MongoDB PRIMERO
      if (imageData.imageUrl !== undefined) image.imageUrl = imageData.imageUrl;
      if (imageData.imageAlt !== undefined) image.imageAlt = imageData.imageAlt;
      if (imageData.imagePositionNumber !== undefined) image.imagePositionNumber = imageData.imagePositionNumber;

      const updatedMoodboard = await moodboard.save();

      // Eliminar la imagen antigua de Cloudinary DESPUÉS (si cambió la URL)
      if (oldImageUrl) {
        await CloudinaryHelper.deleteImage(oldImageUrl);
      }

      return new SuccessResponseModel(updatedMoodboard, 'Imagen actualizada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar imagen');
    }
  }

  // =========================================================================
  // COMENTADO: Funcionalidad de frases pendiente de definir
  // =========================================================================

  // /**
  //  * Agrega una frase al moodboard del usuario
  //  * @param {Object} phraseData - Datos de la frase a agregar
  //  * @param {string} phraseData.phrase - Texto de la frase (requerido)
  //  * @param {string} userId - ID del usuario autenticado
  //  * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
  //  */
  // static async addPhrase(phraseData, userId) {
  //   try {
  //     const addPhraseDto = new AddPhraseDto(phraseData);
  //     const validation = addPhraseDto.validate();

  //     if (!validation.isValid) {
  //       return new BadRequestResponseModel(validation.errors.join(', '));
  //     }

  //     const { moodboard, error } = await this._findMoodboardByUser(userId);
  //     if (error) return error;

  //     const cleanPhrase = addPhraseDto.toPlainObject();
  //     moodboard.phrases.push(cleanPhrase);
  //     const updatedMoodboard = await moodboard.save();

  //     return new SuccessResponseModel(updatedMoodboard, 'Frase agregada correctamente');
  //   } catch (error) {
  //     return ErrorHandler.handleDatabaseError(error, 'agregar frase');
  //   }
  // }

  // /**
  //  * Elimina una frase del moodboard del usuario
  //  * @param {string} phraseId - ID de la frase a eliminar
  //  * @param {string} userId - ID del usuario autenticado
  //  * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
  //  */
  // static async removePhrase(phraseId, userId) {
  //   try {
  //     const { moodboard, error } = await this._findMoodboardByUser(userId);
  //     if (error) return error;

  //     const phraseIndex = moodboard.phrases.findIndex(p => p._id.toString() === phraseId);
  //     if (phraseIndex === -1) {
  //       return new NotFoundResponseModel('Frase no encontrada en el moodboard');
  //     }

  //     moodboard.phrases.splice(phraseIndex, 1);
  //     const updatedMoodboard = await moodboard.save();

  //     return new SuccessResponseModel(updatedMoodboard, 'Frase eliminada correctamente');
  //   } catch (error) {
  //     return ErrorHandler.handleDatabaseError(error, 'eliminar frase');
  //   }
  // }

  // /**
  //  * Actualiza una frase del moodboard del usuario
  //  * @param {string} phraseId - ID de la frase a actualizar
  //  * @param {Object} phraseData - Nuevos datos de la frase
  //  * @param {string} phraseData.phrase - Nuevo texto de la frase
  //  * @param {string} userId - ID del usuario autenticado
  //  * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
  //  */
  // static async updatePhrase(phraseId, phraseData, userId) {
  //   try {
  //     const updatePhraseDto = new UpdatePhraseDto(phraseData);
  //     const validation = updatePhraseDto.validate();

  //     if (!validation.isValid) {
  //       return new BadRequestResponseModel(validation.errors.join(', '));
  //     }

  //     const { moodboard, error } = await this._findMoodboardByUser(userId);
  //     if (error) return error;

  //     const phraseToUpdate = moodboard.phrases.id(phraseId);
  //     if (!phraseToUpdate) {
  //       return new NotFoundResponseModel('Frase no encontrada en el moodboard');
  //     }

  //     const cleanPhrase = updatePhraseDto.toPlainObject();
  //     phraseToUpdate.phrase = cleanPhrase.phrase;
  //     const updatedMoodboard = await moodboard.save();

  //     return new SuccessResponseModel(updatedMoodboard, 'Frase actualizada correctamente');
  //   } catch (error) {
  //     return ErrorHandler.handleDatabaseError(error, 'actualizar frase');
  //   }
  // }
}
