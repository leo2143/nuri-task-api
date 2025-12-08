import Moodboard from '../models/moodboardModel.js';
import { NotFoundResponseModel, ErrorResponseModel, BadRequestResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import {
  CreateMoodboardDto,
  UpdateMoodboardDto,
  AddImageDto,
  AddPhraseDto,
  UpdatePhraseDto,
} from '../models/dtos/moodboard/index.js';
import { ErrorHandler } from './helpers/errorHandler.js';

const MAX_IMAGES_PER_MOODBOARD = 6;
const POPULATE_USER_FIELDS = 'name email avatar';

/**
 * Servicio para manejar la lógica de negocio de moodboards
 */
export class MoodboardService {
  /**
   * Busca un moodboard por ID y usuario
   * @private
   */
  static async _findMoodboardByIdAndUser(id, userId) {
    const moodboard = await Moodboard.findOne({ _id: id, userId });

    if (!moodboard) {
      return { moodboard: null, error: new NotFoundResponseModel('Moodboard no encontrado') };
    }

    return { moodboard, error: null };
  }

  /**
   * Obtiene todos los moodboards del usuario autenticado
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista de moodboards o error
   */
  static async getAllMoodboards(userId) {
    try {
      const moodboards = await Moodboard.find({ userId }).sort({ createdAt: -1 });

      if (moodboards.length === 0) {
        return new NotFoundResponseModel('No se encontraron moodboards para este usuario');
      }

      return new SuccessResponseModel(moodboards, moodboards.length, 'Moodboards obtenidos correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener moodboards');
    }
  }

  /**
   * Obtiene un moodboard específico por ID del usuario autenticado
   * @param {string} id - ID del moodboard
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el moodboard o error
   * Incluye populate de userId (User) para obtener información completa
   */
  static async getMoodboardById(id, userId) {
    try {
      const moodboard = await Moodboard.findOne({ _id: id, userId }).populate('userId', POPULATE_USER_FIELDS);

      if (!moodboard) {
        return new NotFoundResponseModel('Moodboard no encontrado');
      }

      return new SuccessResponseModel(moodboard, 1, 'Moodboard obtenido correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener moodboard');
    }
  }

  /**
   * Crea un nuevo moodboard para el usuario autenticado
   * @param {Object} moodboardData - Datos del moodboard a crear
   * @param {string} moodboardData.title - Título del moodboard (requerido)
   * @param {Array} [moodboardData.images=[]] - Array de imágenes
   * @param {Array} [moodboardData.phrases=[]] - Array de frases inspiradoras
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con el moodboard creado o error
   */
  static async createMoodboard(moodboardData, userId) {
    try {
      const createDto = new CreateMoodboardDto(moodboardData);
      const validation = createDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = createDto.toPlainObject();
      const moodboard = new Moodboard({
        ...cleanData,
        userId,
      });

      const savedMoodboard = await moodboard.save();
      return new CreatedResponseModel(savedMoodboard, 'Moodboard creado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'crear moodboard');
    }
  }

  /**
   * Actualiza un moodboard existente del usuario autenticado
   * @param {string} id - ID del moodboard
   * @param {Object} moodboardData - Datos a actualizar
   * @param {string} [moodboardData.title] - Título del moodboard
   * @param {Array} [moodboardData.images] - Array de imágenes
   * @param {Array} [moodboardData.phrases] - Array de frases
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el moodboard actualizado o error
   */
  static async updateMoodboard(id, moodboardData, userId) {
    try {
      const updateDto = new UpdateMoodboardDto(moodboardData);
      const validation = updateDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = updateDto.toPlainObject();
      const moodboard = await Moodboard.findOneAndUpdate({ _id: id, userId }, cleanData, {
        new: true,
        runValidators: true,
      });

      if (!moodboard) {
        return new NotFoundResponseModel('Moodboard no encontrado');
      }

      return new SuccessResponseModel(moodboard, 1, 'Moodboard actualizado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar moodboard');
    }
  }

  /**
   * Elimina un moodboard del usuario autenticado
   * @param {string} id - ID del moodboard
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta de confirmación o error
   */
  static async deleteMoodboard(id, userId) {
    try {
      const moodboard = await Moodboard.findOneAndDelete({ _id: id, userId });

      if (!moodboard) {
        return new NotFoundResponseModel('Moodboard no encontrado');
      }

      return new SuccessResponseModel({ id }, 1, 'Moodboard eliminado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar moodboard');
    }
  }

  /**
   * Agrega una imagen a un moodboard existente
   * @param {string} id - ID del moodboard
   * @param {Object} imageData - Datos de la imagen
   * @param {string} imageData.imageUrl - URL de la imagen (requerido)
   * @param {string} imageData.imageAlt - Texto alternativo (requerido)
   * @param {number} imageData.imagePositionNumber - Posición de la imagen (requerido)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el moodboard actualizado o error
   * Permite agregar una imagen al moodboard. Límite máximo: 6 imágenes por moodboard
   */
  static async addImage(id, imageData, userId) {
    try {
      const addImageDto = new AddImageDto(imageData);
      const validation = addImageDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { moodboard: existingMoodboard, error } = await this._findMoodboardByIdAndUser(id, userId);
      if (error) return error;

      if (existingMoodboard.images.length >= MAX_IMAGES_PER_MOODBOARD) {
        return new BadRequestResponseModel(
          `El moodboard ya tiene el máximo de ${MAX_IMAGES_PER_MOODBOARD} imágenes permitidas`
        );
      }

      const cleanImage = addImageDto.toPlainObject();
      const moodboard = await Moodboard.findOneAndUpdate(
        { _id: id, userId },
        { $push: { images: cleanImage } },
        { new: true, runValidators: true }
      );

      return new SuccessResponseModel(moodboard, 1, 'Imagen agregada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'agregar imagen');
    }
  }

  /**
   * Elimina una imagen de un moodboard
   * @param {string} id - ID del moodboard
   * @param {string} imageId - ID de la imagen a eliminar
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el moodboard actualizado o error
   */
  static async removeImage(id, imageId, userId) {
    try {
      const moodboard = await Moodboard.findOneAndUpdate(
        { _id: id, userId },
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

      return new SuccessResponseModel(moodboard, 1, 'Imagen eliminada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar imagen');
    }
  }

  /**
   * Actualiza una imagen específica de un moodboard
   * @param {string} id - ID del moodboard
   * @param {string} imageId - ID de la imagen a actualizar
   * @param {Object} imageData - Datos de la imagen a actualizar
   * @param {string} [imageData.imageUrl] - URL de la imagen
   * @param {string} [imageData.imageAlt] - Texto alternativo
   * @param {number} [imageData.imagePositionNumber] - Posición de la imagen
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el moodboard actualizado o error
   */
  static async updateImage(id, imageId, imageData, userId) {
    try {
      const { moodboard, error } = await this._findMoodboardByIdAndUser(id, userId);
      if (error) return error;

      const image = moodboard.images.id(imageId);
      if (!image) {
        return new NotFoundResponseModel('Imagen no encontrada');
      }

      if (imageData.imageUrl !== undefined) image.imageUrl = imageData.imageUrl;
      if (imageData.imageAlt !== undefined) image.imageAlt = imageData.imageAlt;
      if (imageData.imagePositionNumber !== undefined) image.imagePositionNumber = imageData.imagePositionNumber;

      const updatedMoodboard = await moodboard.save();

      return new SuccessResponseModel(updatedMoodboard, 1, 'Imagen actualizada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar imagen');
    }
  }

  /**
   * Busca moodboards por título del usuario autenticado
   * @param {string} searchTerm - Término de búsqueda
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con los moodboards encontrados o error
   */
  static async searchByTitle(searchTerm, userId) {
    try {
      const moodboards = await Moodboard.find({
        userId,
        title: { $regex: searchTerm, $options: 'i' },
      }).sort({ createdAt: -1 });

      if (moodboards.length === 0) {
        return new NotFoundResponseModel('No se encontraron moodboards con ese título');
      }

      return new SuccessResponseModel(moodboards, moodboards.length, 'Moodboards encontrados correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'buscar moodboards');
    }
  }

  /**
   * Agrega una frase a un moodboard existente del usuario autenticado
   * @param {string} id - ID del moodboard
   * @param {Object} phraseData - Datos de la frase a agregar
   * @param {string} phraseData.phrase - Texto de la frase (requerido)
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el moodboard actualizado o error
   */
  static async addPhrase(id, phraseData, userId) {
    try {
      const addPhraseDto = new AddPhraseDto(phraseData);
      const validation = addPhraseDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { moodboard, error } = await this._findMoodboardByIdAndUser(id, userId);
      if (error) return error;

      const cleanPhrase = addPhraseDto.toPlainObject();
      moodboard.phrases.push(cleanPhrase);
      const updatedMoodboard = await moodboard.save();

      return new SuccessResponseModel(updatedMoodboard, 1, 'Frase agregada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'agregar frase');
    }
  }

  /**
   * Elimina una frase de un moodboard del usuario autenticado
   * @param {string} id - ID del moodboard
   * @param {string} phraseId - ID de la frase a eliminar
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el moodboard actualizado o error
   */
  static async removePhrase(id, phraseId, userId) {
    try {
      const { moodboard, error } = await this._findMoodboardByIdAndUser(id, userId);
      if (error) return error;

      const phraseIndex = moodboard.phrases.findIndex(p => p._id.toString() === phraseId);
      if (phraseIndex === -1) {
        return new NotFoundResponseModel('Frase no encontrada en el moodboard');
      }

      moodboard.phrases.splice(phraseIndex, 1);
      const updatedMoodboard = await moodboard.save();

      return new SuccessResponseModel(updatedMoodboard, 1, 'Frase eliminada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar frase');
    }
  }

  /**
   * Actualiza una frase de un moodboard del usuario autenticado
   * @param {string} id - ID del moodboard
   * @param {string} phraseId - ID de la frase a actualizar
   * @param {Object} phraseData - Nuevos datos de la frase
   * @param {string} phraseData.phrase - Nuevo texto de la frase
   * @param {string} userId - ID del usuario autenticado
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el moodboard actualizado o error
   */
  static async updatePhrase(id, phraseId, phraseData, userId) {
    try {
      const updatePhraseDto = new UpdatePhraseDto(phraseData);
      const validation = updatePhraseDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { moodboard, error } = await this._findMoodboardByIdAndUser(id, userId);
      if (error) return error;

      const phraseToUpdate = moodboard.phrases.id(phraseId);
      if (!phraseToUpdate) {
        return new NotFoundResponseModel('Frase no encontrada en el moodboard');
      }

      const cleanPhrase = updatePhraseDto.toPlainObject();
      phraseToUpdate.phrase = cleanPhrase.phrase;
      const updatedMoodboard = await moodboard.save();

      return new SuccessResponseModel(updatedMoodboard, 1, 'Frase actualizada correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar frase');
    }
  }
}
