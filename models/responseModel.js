/**
 * Modelo de respuesta exitosa para la API
 * @class SuccessResponseModel
 * @description Clase para generar respuestas exitosas con datos
 * @property {boolean} success - Siempre true para respuestas exitosas
 * @property {number} status - Código de estado HTTP (200)
 * @property {string} message - Mensaje descriptivo
 * @property {*} data - Datos de la respuesta
 * @property {Object|null} meta - Metadatos adicionales (count, pagination, etc.)
 */
export class SuccessResponseModel {
  constructor(data = null, count = null, message = null, status = 200) {
    this.success = true;
    this.status = status;
    this.message = message;
    this.data = data;
    this.meta = count !== null ? { count } : null;
  }
}

/**
 * Modelo de respuesta de error para la API
 * @class ErrorResponseModel
 * @description Clase para generar respuestas de error
 * @property {boolean} success - Siempre false para errores
 * @property {number} status - Código de estado HTTP
 * @property {string} message - Mensaje de error
 * @property {null} data - Siempre null en errores
 * @property {Object|null} meta - Metadatos adicionales del error
 */
export class ErrorResponseModel {
  /**
   * @param {string} message - Mensaje de error
   * @param {number} status - Código de estado HTTP
   */
  constructor(message = 'Error interno del servidor', status = 500) {
    this.success = false;
    this.status = status;
    this.message = message;
    this.data = null;
    this.meta = null;
  }
}

/**
 * Modelo de respuesta para recursos no encontrados (404)
 * @class NotFoundResponseModel
 * @description Clase para generar respuestas cuando no se encuentra un recurso
 * @property {boolean} success - Siempre false
 * @property {number} status - Código de estado HTTP (404)
 * @property {string} message - Mensaje de error
 * @property {null} data - Siempre null
 * @property {Object|null} meta - Metadatos adicionales
 */
export class NotFoundResponseModel {
  /**
   * @param {string} message - Mensaje de error
   */
  constructor(message = 'No se encontró el recurso') {
    this.success = false;
    this.status = 404;
    this.message = message;
    this.data = null;
    this.meta = null;
  }
}

/**
 * Modelo de respuesta para recursos creados exitosamente (201)
 * @class CreatedResponseModel
 * @description Clase para generar respuestas cuando se crea un recurso exitosamente
 * @property {boolean} success - Siempre true
 * @property {number} status - Código de estado HTTP (201)
 * @property {string} message - Mensaje de éxito
 * @property {*} data - Datos del recurso creado
 * @property {Object|null} meta - Metadatos adicionales
 */
export class CreatedResponseModel {
  constructor(data, message = 'Recurso creado exitosamente') {
    this.success = true;
    this.status = 201;
    this.message = message;
    this.data = data;
    this.meta = null;
  }
}

/**
 * Modelo de respuesta para errores de validación (400)
 * @class ValidationErrorResponseModel
 * @description Clase para generar respuestas cuando hay errores de validación
 * @property {boolean} success - Siempre false
 * @property {number} status - Código de estado HTTP (400)
 * @property {string} message - Mensaje de error
 * @property {null} data - Siempre null
 * @property {Object|null} meta - Metadatos con los errores de validación
 */
export class ValidationErrorResponseModel {
  constructor(message = 'Datos de entrada inválidos', errors = null) {
    this.success = false;
    this.status = 400;
    this.message = message;
    this.data = null;
    this.meta = errors ? { errors } : null;
  }
}

/**
 * Modelo de respuesta para conflictos de unicidad (409)
 * @class ConflictResponseModel
 * @description Clase para generar respuestas cuando hay conflictos con recursos existentes
 * @property {boolean} success - Siempre false
 * @property {number} status - Código de estado HTTP (409)
 * @property {string} message - Mensaje de conflicto
 * @property {null} data - Siempre null
 * @property {Object|null} meta - Metadatos con información del conflicto
 */
export class ConflictResponseModel {
  /**
   * @param {string} message - Mensaje de conflicto
   * @param {string} field - Campo que está en conflicto (opcional)
   * @param {*} value - Valor que causó el conflicto (opcional, no incluir datos sensibles)
   */
  constructor(message = 'El recurso ya existe', field = null, value = null) {
    this.success = false;
    this.status = 409;
    this.message = message;
    this.data = null;
    this.meta = field || value ? { conflict: { field, value } } : null;
  }
}

/**
 * Modelo de respuesta para solicitudes incorrectas (400)
 * @class BadRequestResponseModel
 * @description Clase para generar respuestas cuando la solicitud es incorrecta
 * @property {boolean} success - Siempre false
 * @property {number} status - Código de estado HTTP (400)
 * @property {string} message - Mensaje del error
 * @property {null} data - Siempre null
 * @property {Object|null} meta - Metadatos con detalles adicionales del error
 */
export class BadRequestResponseModel {
  /**
   * @param {string} message - Mensaje del error
   * @param {Object} details - Detalles adicionales del error (opcional)
   */
  constructor(message = 'Solicitud incorrecta', details = null) {
    this.success = false;
    this.status = 400;
    this.message = message;
    this.data = null;
    this.meta = details ? { details } : null;
  }
}

/**
 * Modelo de respuesta para autenticación requerida (401)
 * @class UnauthorizedResponseModel
 * @description Clase para generar respuestas cuando falta o es inválida la autenticación
 * @property {boolean} success - Siempre false
 * @property {number} status - Código de estado HTTP (401)
 * @property {string} message - Mensaje de error
 * @property {null} data - Siempre null
 * @property {Object|null} meta - Metadatos adicionales
 */
export class UnauthorizedResponseModel {
  /**
   * @param {string} message - Mensaje del error de autenticación
   */
  constructor(message = 'Autenticación requerida') {
    this.success = false;
    this.status = 401;
    this.message = message;
    this.data = null;
    this.meta = null;
  }
}

/**
 * Modelo de respuesta para permisos insuficientes (403)
 * @class ForbiddenResponseModel
 * @description Clase para generar respuestas cuando el usuario no tiene permisos
 * @property {boolean} success - Siempre false
 * @property {number} status - Código de estado HTTP (403)
 * @property {string} message - Mensaje de error
 * @property {null} data - Siempre null
 * @property {Object|null} meta - Metadatos adicionales
 */
export class ForbiddenResponseModel {
  /**
   * @param {string} message - Mensaje del error de permisos
   */
  constructor(message = 'Acceso denegado') {
    this.success = false;
    this.status = 403;
    this.message = message;
    this.data = null;
    this.meta = null;
  }
}

/**
 * Modelo de respuesta para operaciones sin contenido (204)
 * @class NoContentResponseModel
 * @description Clase para generar respuestas exitosas sin datos (DELETE exitoso, etc.)
 * @property {boolean} success - Siempre true
 * @property {number} status - Código de estado HTTP (204)
 * @property {string} message - Mensaje de éxito
 * @property {null} data - Siempre null (204 no debe tener cuerpo)
 * @property {null} meta - Siempre null
 */
export class NoContentResponseModel {
  /**
   * @param {string} message - Mensaje de éxito
   */
  constructor(message = 'Operación completada exitosamente') {
    this.success = true;
    this.status = 204;
    this.message = message;
    this.data = null;
    this.meta = null;
  }
}
