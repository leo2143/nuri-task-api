import User from '../models/userModel.js';
import {
  NotFoundResponseModel,
  ErrorResponseModel,
  ConflictResponseModel,
  BadRequestResponseModel,
} from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import chalk from 'chalk';
import crypto from 'crypto';
import { EmailService } from './emailService.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';

/**
 * Servicio para manejar la lógica de negocio de usuarios
 * @class UserService
 */
export class UserService {
  /**
   * Obtiene todos los usuarios con filtros opcionales
   * @static
   * @async
   * @function getAllUsers
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} [filters.search] - Término de búsqueda en nombre
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con la lista de usuarios o error
   */
  static async getAllUsers(filters = {}) {
    try {
      // Construir query de búsqueda
      const query = {};

      // Búsqueda por nombre (case insensitive)
      if (filters.search) {
        query.name = { $regex: filters.search, $options: 'i' };
      }

      const users = await User.find(query).select('-password');
      if (users.length === 0) {
        return new NotFoundResponseModel('No se encontraron usuarios con los filtros aplicados');
      }
      return new SuccessResponseModel(users, users.length, 'Usuarios obtenidos correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener usuarios:', error));
      return new ErrorResponseModel('Error al obtener usuarios');
    }
  }

  /**
   * Obtiene un usuario específico por su ID
   * @static
   * @async
   * @function getUserById
   * @param {string} id - ID del usuario a buscar
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>} Respuesta con el usuario encontrado o error
   */
  static async getUserById(id) {
    try {
      const user = await User.findById(id).select('-password');
      if (!user) {
        return new NotFoundResponseModel('No se encontró el usuario con el id: ' + id + ' en la base de datos');
      }
      return new SuccessResponseModel(user, 1, 'Usuario obtenido correctamente');
    } catch (error) {
      console.error(chalk.red('Error al obtener usuario:', error));
      return new ErrorResponseModel('Error al obtener usuario');
    }
  }

  /**
   * Crea un nuevo usuario en la base de datos
   * @static
   * @async
   * @function createUser
   * @param {Object} userData - Datos del usuario a crear
   * @param {string} userData.name - Nombre del usuario
   * @param {string} userData.email - Email del usuario
   * @param {string} userData.password - Contraseña del usuario (será hasheada)
   * @returns {Promise<CreatedResponseModel|ErrorResponseModel>} Respuesta con el usuario creado o error
   */
  static async createUser(userData) {
    try {
      // Verificar si el email ya existe
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return new ConflictResponseModel(
          'El email ya está registrado. Por favor, utiliza otro email',
          'email',
          userData.email
        );
      }

      // Hashear la contraseña antes de guardar
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Crear usuario con contraseña hasheada
      const user = new User({
        ...userData,
        password: hashedPassword,
      });

      const savedUser = await user.save();
      return new CreatedResponseModel(
        {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
        },
        'Usuario creado correctamente'
      );
    } catch (error) {
      console.error(chalk.red('Error al crear el usuario:', error));

      // Errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors)
          .map(err => err.message)
          .join(', ');
        return new BadRequestResponseModel(`Error de validación: ${messages}`);
      }

      return new ErrorResponseModel('Error al crear usuario');
    }
  }

  static async updateUser(id, userData) {
    try {
      // Si se está actualizando el email, verificar que no exista en otro usuario
      if (userData.email) {
        const existingUser = await User.findOne({ email: userData.email, _id: { $ne: id } });
        if (existingUser) {
          return new ConflictResponseModel(
            'El email ya está en uso por otro usuario. Por favor, utiliza otro email.',
            'email',
            userData.email
          );
        }
      }

      const user = await User.findByIdAndUpdate(id, userData, { new: true });
      if (!user) {
        return new NotFoundResponseModel('No se encontró el usuario con el id: ' + id + ' en la base de datos');
      }
      return new SuccessResponseModel(user, 1, 'Usuario actualizado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar usuario:', error));

      // Errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors)
          .map(err => err.message)
          .join(', ');
        return new BadRequestResponseModel(`Error de validación: ${messages}`);
      }

      return new ErrorResponseModel('Error al actualizar usuario');
    }
  }

  static async deleteUser(id) {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return new NotFoundResponseModel('No se encontró el usuario con el id: ' + id + ' en la base de datos');
      }
      return new SuccessResponseModel(user, 1, 'Usuario eliminado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al eliminar usuario:', error));
      return new ErrorResponseModel('Error al eliminar usuario');
    }
  }

  /**
   * Autentica un usuario y genera un token JWT
   * @static
   * @async
   * @function loginUser
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con token JWT y datos del usuario o error
   */
  static async loginUser(email, password) {
    try {
      // Buscar usuario por email
      const user = await User.findOne({ email });
      if (!user) {
        return new ErrorResponseModel('Credenciales inválidas');
      }

      // Verificar contraseña usando bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return new ErrorResponseModel('Credenciales inválidas');
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return new SuccessResponseModel(
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        },
        1,
        'Login exitoso'
      );
    } catch (error) {
      console.error(chalk.red('Error al hacer login:', error));
      return new ErrorResponseModel('Error al hacer login');
    }
  }
  static async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return new NotFoundResponseModel('No se encontró el usuario con el id: ' + userId + ' en la base de datos');
      }
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return new ErrorResponseModel('Contraseña inválida');
      }
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = newHashedPassword;
      await user.save();
      return new SuccessResponseModel(user, 1, 'Contraseña actualizada correctamente');
    } catch (error) {
      console.error(chalk.red('Error al cambiar la contraseña:', error));
      return new ErrorResponseModel('Error al cambiar la contraseña');
    }
  }
  /**
   * Solicita la recuperación de contraseña (envía email con token)
   * @static
   * @async
   * @function requestPasswordReset
   * @param {string} email - Email del usuario que olvidó su contraseña
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   * @description Genera un token de recuperación, lo guarda en la BD y envía un email al usuario
   */
  static async requestPasswordReset(email) {
    try {
      // Buscar usuario por email
      const user = await User.findOne({ email });
      if (!user) {
        // Por seguridad, no revelar si el email existe o no
        return new SuccessResponseModel(
          { message: 'Si el email existe, recibirás un correo con instrucciones' },
          1,
          'Solicitud procesada'
        );
      }

      // Generar token de recuperación seguro (32 bytes en hexadecimal)
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Hashear el token antes de guardarlo en la BD (seguridad adicional)
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Guardar token y fecha de expiración (1 hora)
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hora en milisegundos
      await user.save();

      // Enviar email con el token SIN hashear
      const emailResult = await EmailService.sendPasswordResetEmail(email, resetToken, user.name);

      if (!emailResult.success) {
        console.error(chalk.red('Error al enviar email:', emailResult.error));
        return new ErrorResponseModel('Error al enviar el email de recuperación');
      }

      console.log(chalk.green('✓ Token de recuperación generado para:', email));

      return new SuccessResponseModel(
        {
          message: 'Si el email existe, recibirás un correo con instrucciones',
          // Solo en desarrollo, mostrar el token (QUITAR EN PRODUCCIÓN)
          ...(process.env.NODE_ENV === 'development' && { devToken: resetToken }),
        },
        1,
        'Email de recuperación enviado'
      );
    } catch (error) {
      console.error(chalk.red('Error al solicitar recuperación de contraseña:', error));
      return new ErrorResponseModel('Error al procesar la solicitud de recuperación');
    }
  }

  /**
   * Verifica si un token de recuperación es válido
   * @static
   * @async
   * @function verifyResetToken
   * @param {string} token - Token de recuperación a verificar
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>}
   * @description Verifica que el token existe y no ha expirado
   */
  static async verifyResetToken(token) {
    try {
      // Hashear el token recibido para comparar
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Buscar usuario con ese token y que no haya expirado
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

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
   * @static
   * @async
   * @function resetPasswordWithToken
   * @param {string} token - Token de recuperación
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>}
   * @description Verifica el token y actualiza la contraseña del usuario
   */
  static async resetPasswordWithToken(token, newPassword) {
    try {
      // Validar que se proporcionó una nueva contraseña
      if (!newPassword || newPassword.length < 6) {
        return new ErrorResponseModel('La contraseña debe tener al menos 6 caracteres');
      }

      // Hashear el token recibido para comparar
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Buscar usuario con ese token y que no haya expirado
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return new ErrorResponseModel('Token inválido o expirado');
      }

      // Hashear la nueva contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña y limpiar tokens de recuperación
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      // Enviar email de confirmación
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
   * Resetea la contraseña de un usuario (solo para admin)
   * @static
   * @async
   * @function resetUserPassword
   * @param {string} userId - ID del usuario
   * @param {string} newPassword - Nueva contraseña temporal
   * @returns {Promise<SuccessResponseModel|NotFoundResponseModel|ErrorResponseModel>}
   * @description Solo admin puede resetear contraseñas. Genera una contraseña temporal hasheada.
   */
  static async resetUserPassword(userId, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return new NotFoundResponseModel('No se encontró el usuario con el id: ' + userId);
      }

      // Hashear la nueva contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
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
   * Genera una contraseña temporal segura (solo para admin)
   * @static
   * @function generateTemporaryPassword
   * @param {number} length - Longitud de la contraseña (default: 12)
   * @returns {string} Contraseña temporal
   * @description Genera una contraseña aleatoria segura para reseteos
   */
  static generateTemporaryPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
