/**
 * DTO para respuesta de usuario
 */
export class UserDto {
  constructor(user) {
    this.id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.isAdmin = user.isAdmin;
  }

  static fromUser(user) {
    return new UserDto(user);
  }

  static fromArray(users) {
    return users.map(user => new UserDto(user));
  }
}
