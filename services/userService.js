import User from '../models/userModel.js';
import {
  NotFoundResponseModel,
  ErrorResponseModel,
  ConflictResponseModel,
  BadRequestResponseModel,
  SuccessResponseModel,
  CreatedResponseModel,
} from '../models/responseModel.js';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { EmailService } from './emailService.js';
import { UserServiceHelpers } from './helpers/userServiceHelpers.js';
import { ErrorHandler } from './helpers/errorHandler.js';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  ResetPasswordDto,
  LoginUserDto,
  UserFilterDto,
} from '../models/dtos/users/index.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

/**
 * Servicio para manejar la lógica de negocio de usuarios
 */
export class UserService {
  /**
   * Obtiene todos los usuarios con filtros opcionales
   * @param {Object} [filters={}] - Filtros de búsqueda (search, isAdmin, isSubscribed, createdFrom, createdTo, sortBy, sortOrder)
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   * Devuelve solo información mínima (id, name, email, profileImageUrl, subscription)
   * Para información completa, usar getUserById
   */
  static async getAllUsers(filters = {}) {
    try {
      const filterDto = new UserFilterDto(filters);
      const validation = filterDto.validate();

      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const query = filterDto.toMongoQuery();
      const sort = filterDto.toMongoSort();

      const users = await User.find(query)
        .select('name email profileImageUrl subscription createdAt updatedAt')
        .sort(sort)
        .lean();

      if (users.length === 0) {
        return new NotFoundResponseModel('No se encontraron usuarios con los filtros aplicados');
      }

      return new SuccessResponseModel(users, users.length, 'Usuarios obtenidos correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener usuarios');
    }
  }

  /**
   * Obtiene un usuario específico por su ID
   * @param {string} id - ID del usuario
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   * Devuelve información completa del usuario (excepto password y tokens)
   */
  static async getUserById(id) {
    try {
      const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpires');

      if (!user) {
        return new NotFoundResponseModel(`No se encontró el usuario con el id: ${id} en la base de datos`);
      }

      return new SuccessResponseModel(user, 1, 'Usuario obtenido correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'obtener usuario');
    }
  }

  /**
   * Crea un nuevo usuario en la base de datos
   */
  static async createUser(userData) {
    try {
      const createDto = new CreateUserDto(userData);

      const validation = createDto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const existingUser = await User.findOne({ email: createDto.email });
      if (existingUser) {
        return new ConflictResponseModel(
          'El email ya está registrado. Por favor, utiliza otro email',
          'email',
          createDto.email
        );
      }

      const cleanData = createDto.toPlainObject();
      const hashedPassword = await UserServiceHelpers.hashPassword(cleanData.password);

      const user = new User({
        ...cleanData,
        password: hashedPassword,
      });

      const savedUser = await user.save();
      const userResponse = savedUser.toObject();
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpires;
      delete userResponse.subscription;

      return new CreatedResponseModel(userResponse, 'Usuario creado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'crear usuario');
    }
  }

  /**
   * Actualiza un usuario existente
   */
  static async updateUser(id, userData) {
    try {
      const updateDto = new UpdateUserDto(userData);

      const validation = updateDto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      if (updateDto.email) {
        const emailExists = await this._checkEmailExists(updateDto.email, id);
        if (emailExists) {
          return new ConflictResponseModel(
            'El email ya está en uso por otro usuario. Por favor, utiliza otro email.',
            'email',
            updateDto.email
          );
        }
      }

      const cleanData = updateDto.toPlainObject();
      const user = await User.findByIdAndUpdate(id, cleanData, { new: true }).select('-password');

      if (!user) {
        return new NotFoundResponseModel(`No se encontró el usuario con el id: ${id} en la base de datos`);
      }

      return new SuccessResponseModel(user, 1, 'Usuario actualizado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'actualizar usuario');
    }
  }

  /**
   * Elimina un usuario por su ID
   */
  static async deleteUser(id) {
    try {
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return new NotFoundResponseModel(`No se encontró el usuario con el id: ${id} en la base de datos`);
      }

      return new SuccessResponseModel(user, 1, 'Usuario eliminado correctamente');
    } catch (error) {
      return ErrorHandler.handleDatabaseError(error, 'eliminar usuario');
    }
  }

  /**
   * Autentica un usuario y genera un token JWT
   */
  static async loginUser(email, password) {
    try {
      const loginDto = new LoginUserDto({ email, password });

      const validation = loginDto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = loginDto.toPlainObject();
      const user = await User.findOne({ email: cleanData.email });

      if (!user) {
        return new ErrorResponseModel('Credenciales inválidas');
      }

      const isPasswordValid = await UserServiceHelpers.verifyPassword(cleanData.password, user.password);
      if (!isPasswordValid) {
        return new ErrorResponseModel('Credenciales inválidas');
      }

      const payload = UserServiceHelpers.createJWTPayload(user);
      const token = UserServiceHelpers.generateJWT(payload, JWT_SECRET);
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.resetPasswordToken;
      delete userResponse.resetPasswordExpires;
      delete userResponse.subscription.endDate;
      delete userResponse.subscription.startDate;

      return new SuccessResponseModel(
        {
          token,
          user: userResponse,
        },
        1,
        'Login exitoso'
      );
    } catch (error) {
      console.error(chalk.red('Error al hacer login:', error));
      return new ErrorResponseModel('Error al hacer login');
    }
  }

  /**
   * Cambia la contraseña de un usuario
   */
  static async changePassword(userId, oldPassword, newPassword) {
    try {
      const changeDto = new ChangePasswordDto({ oldPassword, newPassword });

      const validation = changeDto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const user = await User.findById(userId);
      if (!user) {
        return new NotFoundResponseModel(`No se encontró el usuario con el id: ${userId} en la base de datos`);
      }

      const isPasswordValid = await UserServiceHelpers.verifyPassword(oldPassword, user.password);
      if (!isPasswordValid) {
        return new ErrorResponseModel('Contraseña actual inválida');
      }

      const hashedPassword = await UserServiceHelpers.hashPassword(newPassword);
      user.password = hashedPassword;
      await user.save();

      return new SuccessResponseModel(null, 1, 'Contraseña actualizada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al cambiar la contraseña:', error));
      return new ErrorResponseModel('Error al cambiar la contraseña');
    }
  }

  /**
   * Solicita la recuperación de contraseña
   */
  static async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return this._createSecureResetResponse();
      }

      const resetToken = UserServiceHelpers.generateResetToken();
      const hashedToken = UserServiceHelpers.hashToken(resetToken);

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = UserServiceHelpers.getResetTokenExpiration();
      await user.save();

      const emailResult = await EmailService.sendPasswordResetEmail(email, resetToken, user.name);

      if (!emailResult.success) {
        console.error(chalk.red('Error al enviar email:', emailResult.error));
        return new ErrorResponseModel('Error al enviar el email de recuperación');
      }

      console.log(chalk.green('✓ Token de recuperación generado para:', email));

      return this._createSecureResetResponse(resetToken);
    } catch (error) {
      console.error(chalk.red('Error al solicitar recuperación de contraseña:', error));
      return new ErrorResponseModel('Error al procesar la solicitud de recuperación');
    }
  }

  /**
   * Verifica si un token de recuperación es válido
   */
  static async verifyResetToken(token) {
    try {
      const hashedToken = UserServiceHelpers.hashToken(token);
      const user = await this._findUserByValidToken(hashedToken);

      if (!user) {
        return new ErrorResponseModel('Token inválido o expirado');
      }

      return new SuccessResponseModel(
        {
          valid: true,
          email: user.email,
          message: 'Token válido',
        },
        1,
        'Token verificado correctamente'
      );
    } catch (error) {
      console.error(chalk.red('Error al verificar token:', error));
      return new ErrorResponseModel('Error al verificar el token');
    }
  }

  /**
   * Resetea la contraseña usando el token de recuperación
   */
  static async resetPasswordWithToken(token, newPassword) {
    try {
      const resetDto = new ResetPasswordDto({ token, newPassword });

      const validation = resetDto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const cleanData = resetDto.toPlainObject();
      const hashedToken = UserServiceHelpers.hashToken(cleanData.token);
      const user = await this._findUserByValidToken(hashedToken);

      if (!user) {
        return new ErrorResponseModel('Token inválido o expirado');
      }

      const hashedPassword = await UserServiceHelpers.hashPassword(cleanData.newPassword);
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      await EmailService.sendPasswordChangedConfirmation(user.email, user.name);

      console.log(chalk.green('✓ Contraseña reseteada exitosamente para:', user.email));

      return new SuccessResponseModel(
        {
          message: 'Contraseña actualizada exitosamente',
          email: user.email,
        },
        1,
        'Contraseña reseteada correctamente'
      );
    } catch (error) {
      console.error(chalk.red('Error al resetear contraseña con token:', error));
      return new ErrorResponseModel('Error al resetear la contraseña');
    }
  }

  /**
   * Resetea la contraseña de un usuario (solo admin)
   */
  static async resetUserPassword(userId, newPassword) {
    try {
      if (!newPassword || newPassword.length < 6) {
        return new BadRequestResponseModel('La contraseña debe tener al menos 6 caracteres');
      }

      const user = await User.findById(userId);
      if (!user) {
        return new NotFoundResponseModel(`No se encontró el usuario con el id: ${userId}`);
      }

      const hashedPassword = await UserServiceHelpers.hashPassword(newPassword);
      user.password = hashedPassword;
      await user.save();

      return new SuccessResponseModel(
        {
          userId: user._id,
          email: user.email,
          temporaryPassword: newPassword,
          message: 'Contraseña reseteada. El usuario debe cambiarla en su próximo login.',
        },
        1,
        'Contraseña reseteada correctamente'
      );
    } catch (error) {
      console.error(chalk.red('Error al resetear contraseña:', error));
      return new ErrorResponseModel('Error al resetear contraseña');
    }
  }

  /**
   * Verifica si un email ya está en uso por otro usuario
   * @private
   * @param {string} email - Email a verificar
   * @param {string} excludeUserId - ID del usuario a excluir de la búsqueda
   * @returns {Promise<boolean>}
   */
  static async _checkEmailExists(email, excludeUserId) {
    const existingUser = await User.findOne({ email, _id: { $ne: excludeUserId } });
    return !!existingUser;
  }

  /**
   * Crea una respuesta segura para solicitud de reset de contraseña
   * @private
   * @param {string|null} [devToken=null] - Token de desarrollo (solo en modo dev)
   * @returns {SuccessResponseModel}
   */
  static _createSecureResetResponse(devToken = null) {
    const response = {
      message: 'Si el email existe, recibirás un correo con instrucciones',
    };

    if (process.env.NODE_ENV === 'development' && devToken) {
      response.devToken = devToken;
    }

    return new SuccessResponseModel(response, 1, 'Email de recuperación enviado');
  }

  /**
   * Busca un usuario por token de reset válido
   * @private
   * @param {string} hashedToken - Token hasheado
   * @returns {Promise<User|null>}
   */
  static async _findUserByValidToken(hashedToken) {
    return User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
  }
}
