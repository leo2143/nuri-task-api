import User from '../models/userModel.js';
import { NotFoundResponseModel, ErrorResponseModel } from '../models/responseModel.js';
import { SuccessResponseModel, CreatedResponseModel } from '../models/responseModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';


/**
 * Servicio para manejar la lógica de negocio de usuarios
 * @class UserService
 */
export class UserService {
  /**
   * Obtiene todos los usuarios de la base de datos
   * @static
   * @async
   * @function getAllUsers
   * @returns {Promise<SuccessResponseModel|ErrorResponseModel>} Respuesta con la lista de usuarios o error
   * @example
   */
  static async getAllUsers() {
    try {
      const users = await User.find().select('-password');
      if (users.length === 0) {
        return new NotFoundResponseModel('No se encontraron usuarios en la base de datos');
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
   * @example
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
   * @example
   */
  static async createUser(userData) {
    try {
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
      return new ErrorResponseModel('Error al crear usuario');
    }
  }

  static async updateUser(id, userData) {
    try {
      const user = await User.findByIdAndUpdate(id, userData, { new: true });
      if (!user) {
        return new NotFoundResponseModel('No se encontró el usuario con el id: ' + id + ' en la base de datos');
      }
      return new SuccessResponseModel(user, 1, 'Usuario actualizado correctamente');
    } catch (error) {
      console.error(chalk.red('Error al actualizar usuario:', error));
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
}
