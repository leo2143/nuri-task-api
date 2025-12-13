/**
 * DTO para crear un nuevo usuario
 */
export class CreateUserDto {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.isAdmin = data.isAdmin || false;
  }

  _validateName() {
    if (!this.name || typeof this.name !== 'string' || this.name.trim() === '') {
      return 'El nombre es requerido y debe ser un valor válido';
    }
    return null;
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

    if (this.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    return null;
  }

  validate() {
    const errors = [];

    const nameError = this._validateName();
    if (nameError) errors.push(nameError);

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
      name: this.name.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password,
      isAdmin: this.isAdmin,
    };
  }
}
