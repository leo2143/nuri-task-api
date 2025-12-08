/**
 * DTO para login de usuario
 */
export class LoginUserDto {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
  }

  _validateEmail() {
    if (!this.email || typeof this.email !== 'string') {
      return 'El email es requerido';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      return 'Email inválido';
    }

    return null;
  }

  _validatePassword() {
    if (!this.password) {
      return 'La contraseña es requerida';
    }
    return null;
  }

  validate() {
    const errors = [];

    const emailError = this._validateEmail();
    if (emailError) errors.push(emailError);

    const passwordError = this._validatePassword();
    if (passwordError) errors.push(passwordError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toPlainObject() {
    return {
      email: this.email.trim().toLowerCase(),
      password: this.password,
    };
  }
}
