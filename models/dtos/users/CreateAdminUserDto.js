import { CreateUserDto } from './CreateUserDto.js';

/**
 * DTO para crear un usuario con control admin completo
 * Extiende CreateUserDto y agrega control de isAdmin y suscripción
 * Las fechas de suscripción se calculan automáticamente en el backend
 */
export class CreateAdminUserDto extends CreateUserDto {
  constructor(data) {
    super(data);
    
    this.isAdmin = data.isAdmin || false;
    this.profileImageUrl = data.profileImageUrl || null;
    this.isSubscribed = data.isSubscribed || false;
  }

  _validateIsAdmin() {
    if (typeof this.isAdmin !== 'boolean') {
      return 'isAdmin debe ser un valor booleano';
    }
    return null;
  }

  _validateIsSubscribed() {
    if (typeof this.isSubscribed !== 'boolean') {
      return 'isSubscribed debe ser un valor booleano';
    }
    return null;
  }

  validate() {
    const parentValidation = super.validate();
    const errors = [...parentValidation.errors];

    const isAdminError = this._validateIsAdmin();
    if (isAdminError) errors.push(isAdminError);

    const isSubscribedError = this._validateIsSubscribed();
    if (isSubscribedError) errors.push(isSubscribedError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toPlainObject() {
    const parentData = super.toPlainObject();
    
    return {
      ...parentData,
      isAdmin: this.isAdmin,
      profileImageUrl: this.profileImageUrl,
      isSubscribed: this.isSubscribed,
    };
  }
}