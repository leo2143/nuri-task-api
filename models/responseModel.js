/**
 * Modelo de respuesta exitosa para la API
 * @class SuccessResponseModel
 * @description Clase para generar respuestas exitosas con datos
 */
export class SuccessResponseModel {
  constructor(data = null, count = null, message = null, status = 200) {
    this.message = message;
    this.status = status;
    this.data = data;
    this.count = count;
    this.success = true;
  }
}

/**
 * Modelo de respuesta de error para la API
 * @class ErrorResponseModel
 * @description Clase para generar respuestas de error
 */
export class ErrorResponseModel {
  /**
   * @param {string} message - Mensaje de error
   * @param {number} status - Código de estado HTTP
   */
  constructor(message = "Error interno del servidor", status = 500) {
    this.message = message;
    this.status = status;
    this.success = false;
  }
}

/**
 * Modelo de respuesta para recursos no encontrados (404)
 * @class NotFoundResponseModel
 * @description Clase para generar respuestas cuando no se encuentra un recurso
 */
export class NotFoundResponseModel {
  /**
   * @param {string} message - Mensaje de error
   */
  constructor(message = "No se encontró el recurso") {
    this.message = message;
    this.status = 404;
    this.success = false;
  }
}

/**
 * Modelo de respuesta para recursos creados exitosamente (201)
 * @class CreatedResponseModel
 * @description Clase para generar respuestas cuando se crea un recurso exitosamente
 */
export class CreatedResponseModel {
  constructor(data, message = "Recurso creado exitosamente") {
    this.message = message;
    this.status = 201;
    this.data = data;
    this.success = true;
  }
}

/**
 * Modelo de respuesta para errores de validación (400)
 * @class ValidationErrorResponseModel
 * @description Clase para generar respuestas cuando hay errores de validación
 */
export class ValidationErrorResponseModel {
  constructor(message = "Datos de entrada inválidos", errors = null) {
    this.message = message;
    this.status = 400;
    this.errors = errors;
    this.success = false;
  }
}

/**
 * Modelo de respuesta para conflictos de unicidad (409)
 * @class ConflictResponseModel
 * @description Clase para generar respuestas cuando hay conflictos con recursos existentes
 * @example
 * // Uso típico: email duplicado, username duplicado, etc.
 * return new ConflictResponseModel('El email ya está registrado');
 */
export class ConflictResponseModel {
  /**
   * @param {string} message - Mensaje de conflicto
   * @param {string} field - Campo que está en conflicto (opcional)
   * @param {*} value - Valor que causó el conflicto (opcional, no incluir datos sensibles)
   */
  constructor(message = 'El recurso ya existe', field = null, value = null) {
    this.message = message;
    this.status = 409;
    this.success = false;
    this.conflict = {
      field: field,
      value: value,
    };
  }
}

/**
 * Modelo de respuesta para solicitudes incorrectas (400)
 * @class BadRequestResponseModel
 * @description Clase para generar respuestas cuando la solicitud es incorrecta
 * @example
 * // Uso típico: parámetros faltantes, formato incorrecto, etc.
 * return new BadRequestResponseModel('El campo email es requerido');
 */
export class BadRequestResponseModel {
  /**
   * @param {string} message - Mensaje del error
   * @param {Object} details - Detalles adicionales del error (opcional)
   */
  constructor(message = 'Solicitud incorrecta', details = null) {
    this.message = message;
    this.status = 400;
    this.success = false;
    this.details = details;
  }
}