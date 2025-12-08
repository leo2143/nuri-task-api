import chalk from 'chalk';
import { ErrorResponseModel, BadRequestResponseModel } from '../../models/responseModel.js';

export class ErrorHandler {
  static handleDatabaseError(error, context) {
    console.error(chalk.red(`Error en ${context}:`), error);

    if (error.name === 'ValidationError') {
      return this.handleValidationError(error);
    }

    if (error.name === 'CastError') {
      return new BadRequestResponseModel('ID inválido');
    }

    if (error.code === 11000) {
      return this.handleDuplicateKeyError(error);
    }

    return new ErrorResponseModel(`Error al ${context}`);
  }

  static handleValidationError(error) {
    const messages = Object.values(error.errors)
      .map(err => err.message)
      .join(', ');
    return new BadRequestResponseModel(`Error de validación: ${messages}`);
  }

  static handleDuplicateKeyError(error) {
    const field = Object.keys(error.keyPattern)[0];
    return new BadRequestResponseModel(`El ${field} ya está en uso`);
  }
}
