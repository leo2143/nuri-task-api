import { UpdateUserDto } from './UpdateUserDto.js';

/**
 * DTO para actualizar un usuario con control admin completo
 * Extiende UpdateUserDto y agrega control de suscripción
 * Las fechas de suscripción se recalculan automáticamente si isSubscribed cambia
 */
export class UpdateAdminUserDto extends UpdateUserDto {
  constructor(data) {
    super(data);
    
    this.isSubscribed = data.isSubscribed;
    this.profileImageUrl = data.profileImageUrl;
  }

  _validateIsSubscribed() {
    if (this.isSubscribed === undefined) return null;
    
    if (typeof this.isSubscribed !== 'boolean') {
      return 'isSubscribed debe ser un valor booleano';
    }
    return null;
  }

  validate() {
    const parentValidation = super.validate();
    const errors = [...parentValidation.errors];

    const isSubscribedError = this._validateIsSubscribed();
    if (isSubscribedError) errors.push(isSubscribedError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toPlainObject() {
    const parentData = super.toPlainObject();
    
    if (this.isSubscribed !== undefined) {
      parentData.isSubscribed = this.isSubscribed;
    }

    if (this.profileImageUrl !== undefined) {
      parentData.profileImageUrl = this.profileImageUrl;
    }

    return parentData;
  }
}

