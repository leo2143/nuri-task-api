import { CreateUserDto } from './CreateUserDto.js';

/**
 * DTO para actualizar un usuario existente
 */
export class UpdateUserDto extends CreateUserDto {
  constructor(data) {
    super(data);
    this.name = data.name;
    this.email = data.email;
    this.isAdmin = data.isAdmin;
    this.password = data.password;
  }

  _validateName() {
    if (this.name === undefined) return null;
    return super._validateName();
  }

  _validateEmail() {
    if (this.email === undefined) return null;
    return super._validateEmail();
  }

  _validatePassword() {
    if (this.password === undefined) return null;
    return super._validatePassword();
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
    const result = {};

    if (this.name !== undefined) {
      result.name = this.name.trim();
    }

    if (this.email !== undefined) {
      result.email = this.email.trim().toLowerCase();
    }

    if (this.isAdmin !== undefined) {
      result.isAdmin = this.isAdmin;
    }

    if (this.password !== undefined) {
      result.password = this.password;
    }

    return result;
  }
}
