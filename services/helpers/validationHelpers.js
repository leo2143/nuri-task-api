import { CloudinaryHelper } from './cloudinaryHelper.js';

/**
 * Helpers de validación comunes reutilizables
 * @class ValidationHelpers
 * @description Contiene métodos de validación comunes que se repiten en múltiples DTOs
 */
export class ValidationHelpers {
  /**
   * Coerce query/body a boolean. Acepta true/false y "true"/"false".
   * @param {*} value
   * @returns {boolean|undefined|null} undefined si falta; null si no es parseable
   */
  static parseBoolean(value) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === true || value === 'true') {
      return true;
    }
    if (value === false || value === 'false') {
      return false;
    }
    return null;
  }

  /**
   * Coerce query/body a number. Acepta number y string numérico.
   * @param {*} value
   * @returns {number|undefined|null} undefined si falta; null si no es parseable
   */
  static parseNumber(value) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  }
  /**
   * Valida una URL de imagen
   * @param {string} imageUrl - URL de la imagen a validar
   * @param {boolean} required - Si el campo es requerido (default: true)
   * @param {string} fieldName - Nombre del campo para el mensaje de error (default: 'La URL de la imagen')
   * @returns {string|null} Mensaje de error o null si es válido
   * @example
   * // Validación requerida
   * const error = ValidationHelpers.validateImageUrl(this.imageUrl, true, 'La URL de la imagen');
   * if (error) errors.push(error);
   * @example
   * // Validación opcional
   * const error = ValidationHelpers.validateImageUrl(this.imageUrl, false);
   * if (error) errors.push(error);
   */
  static validateImageUrl(imageUrl, required = true, fieldName = 'La URL de la imagen') {
    if (imageUrl === undefined || imageUrl === null) {
      if (required) {
        return `${fieldName} es requerida y debe ser un string válido`;
      }
      return null;
    }

    if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      if (required) {
        return `${fieldName} es requerida y debe ser un string válido`;
      }
      return `${fieldName} debe ser un string válido`;
    }

    return null;
  }

  /**
   * Valida que la URL sea de entrega de Cloudinary de este proyecto.
   * @param {string} imageUrl - URL a validar
   * @param {boolean} [required=true] - Si el campo es requerido
   * @param {string} [fieldName='La URL de la imagen'] - Nombre del campo para el mensaje
   * @returns {string|null} Mensaje de error o null si es válido
   */
  static validateCloudinaryImageUrl(imageUrl, required = true, fieldName = 'La URL de la imagen') {
    const baseError = this.validateImageUrl(imageUrl, required, fieldName);
    if (baseError) {
      return baseError;
    }
    if (imageUrl === undefined || imageUrl === null) {
      return null;
    }

    if (!CloudinaryHelper.isCloudinaryDeliveryUrl(imageUrl)) {
      return `${fieldName} debe ser una URL de Cloudinary de este proyecto`;
    }

    return null;
  }
}

