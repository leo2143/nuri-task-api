import { ValidationHelpers } from '../../../services/helpers/validationHelpers.js';

/**
 * DTO para actualizar solo la foto de perfil del usuario
 * @class UpdateProfileImageDto
 * @description Define la estructura y validaciones para actualizar la imagen de perfil
 */
export class UpdateProfileImageDto {
  /**
   * @param {Object} data - Datos de la imagen de perfil
   * @param {string} data.profileImageUrl - URL de la imagen de perfil (requerido)
   */
  constructor(data) {
    this.profileImageUrl = data.profileImageUrl;
  }

  /**
   * Valida que los datos del DTO sean correctos
   * @returns {Object} Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    const profileImageUrlError = ValidationHelpers.validateImageUrl(
      this.profileImageUrl,
      true,
      'La URL de la imagen de perfil'
    );
    if (profileImageUrlError) errors.push(profileImageUrlError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convierte el DTO a un objeto plano
   * @returns {Object} Objeto plano con los datos
   */
  toPlainObject() {
    return {
      profileImageUrl: this.profileImageUrl.trim(),
    };
  }
}

