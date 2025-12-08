/**
 * DTO para resetear contraseña con token
 */
export class ResetPasswordDto {
  constructor(data) {
    this.token = data.token;
    this.newPassword = data.newPassword;
  }

  _validateToken() {
    if (!this.token || typeof this.token !== 'string' || this.token.trim() === '') {
      return 'Token de recuperación requerido';
    }
    return null;
  }

  _validateNewPassword() {
    if (!this.newPassword) {
      return 'La nueva contraseña es requerida';
    }

    if (this.newPassword.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    return null;
  }

  validate() {
    const errors = [];

    const tokenError = this._validateToken();
    if (tokenError) errors.push(tokenError);

    const passwordError = this._validateNewPassword();
    if (passwordError) errors.push(passwordError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toPlainObject() {
    return {
      token: this.token.trim(),
      newPassword: this.newPassword,
    };
  }
}
