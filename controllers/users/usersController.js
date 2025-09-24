import { UserService } from '../../services/userService.js';

/**
 * Controlador para manejar las peticiones HTTP relacionadas con usuarios
 * @class UsersController
 */
export class UsersController {
  /**
   * Crea un nuevo usuario
   * @static
   * @async
   * @function createUser
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.body - Datos del usuario a crear
   * @param {string} req.body.name - Nombre del usuario
   * @param {string} req.body.email - Email del usuario
   * @param {string} req.body.password - Contraseña del usuario
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   * @example
   * // POST /api/users
   * // Body: { "name": "Juan", "email": "juan@test.com", "password": "123456" }
   */
  static async createUser(req, res) {
    const userData = req.body;
    const user = await UserService.createUser(userData);
    res.json(user);
  }

  static async updateUser(req, res) {
    const id = req.params.id;
    const userData = req.body;
    const user = await UserService.updateUser(id, userData);
    res.json(user);
  }

  static async getAllUsers(req, res) {
    const users = await UserService.getAllUsers();
    res.json(users);
  }

  static async getUserById(req, res) {
    const id = req.params.id;
    const user = await UserService.getUserById(id);
    res.json(user);
  }

  static async deleteUser(req, res) {
    const id = req.params.id;
    const user = await UserService.deleteUser(id);
    res.json(user);
  }

  /**
   * Autentica un usuario y retorna un token JWT
   * @static
   * @async
   * @function loginUser
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.body - Credenciales del usuario
   * @param {string} req.body.email - Email del usuario
   * @param {string} req.body.password - Contraseña del usuario
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP con token
   * @example
   */
  static async loginUser(req, res) {
    const { email, password } = req.body;
    const result = await UserService.loginUser(email, password);
    res.json(result);
  }
}
