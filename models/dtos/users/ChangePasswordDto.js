/**
 * DTO para cambiar la contraseña de un usuario
 */
export class ChangePasswordDto {
  constructor(data) {
    this.oldPassword = data.oldPassword;
    this.newPassword = data.newPassword;
  }

  _validateOldPassword() {
    if (!this.oldPassword) {
      return 'La contraseña actual es requerida';
    }
    return null;
  }

  _validateNewPassword() {
    if (!this.newPassword) {
      return 'La nueva contraseña es requerida';
    }

    if (this.newPassword.length < 6) {
      return 'La nueva contraseña debe tener al menos 6 caracteres';
    }

    if (this.oldPassword === this.newPassword) {
      return 'La nueva contraseña debe ser diferente a la actual';
    }

    return null;
  }

  validate() {
    const errors = [];

    const oldPasswordError = this._validateOldPassword();
    if (oldPasswordError) errors.push(oldPasswordError);

    const newPasswordError = this._validateNewPassword();
    if (newPasswordError) errors.push(newPasswordError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toPlainObject() {
    return {
      oldPassword: this.oldPassword,
      newPassword: this.newPassword,
    };
  }
}
