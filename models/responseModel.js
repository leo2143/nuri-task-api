export class SuccessResponseModel {
    constructor(data = null, count = null, message = null, status = 200) {
        this.message = message;
        this.status = status;
        this.data = data;
        this.count = count;
        this.success = true;
    }
}

export class ErrorResponseModel { 
    constructor(message = "Error interno del servidor", status = 500) {
        this.message = message;
        this.status = status;
        this.success = false;
    }
}

export class NotFoundResponseModel { 
    constructor(message = "No se encontró el recurso") {
        this.message = message;
        this.status = 404;
        this.success = false;
    }
}

// Opcional: Agregar más clases específicas
export class CreatedResponseModel {
    constructor(data, message = "Recurso creado exitosamente") {
        this.message = message;
        this.status = 201;
        this.data = data;
        this.success = true;
    }
}

export class ValidationErrorResponseModel {
    constructor(message = "Datos de entrada inválidos", errors = null) {
        this.message = message;
        this.status = 400;
        this.errors = errors;
        this.success = false;
    }
}
