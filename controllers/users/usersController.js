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

  /**
   * Obtiene todos los usuarios con filtros opcionales
   * @static
   * @async
   * @function getAllUsers
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.query - Query parameters para filtros
   * @param {string} [req.query.search] - Término de búsqueda en nombre
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   */
  static async getAllUsers(req, res) {
    try {
      // Extraer filtros de query parameters
      const filters = {
        search: req.query.search,
      };

      const result = await UserService.getAllUsers(filters);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en getAllUsers:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
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
  static async changePassword(req, res) {
    try {
      const userId = req.userId;
      const { oldPassword, newPassword } = req.body;
      const result = await UserService.changePassword(userId, oldPassword, newPassword);
      res.json(result);
    } catch (error) {
      console.error('Error en changePassword:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Resetea la contraseña de un usuario (solo admin)
   * @static
   * @async
   * @function resetUserPassword
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.id - ID del usuario
   * @param {Object} req.body - Datos de la nueva contraseña
   * @param {string} [req.body.newPassword] - Contraseña temporal (opcional, se genera si no se envía)
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   * @description Solo admin puede resetear contraseñas. Si no se envía newPassword, se genera una automática.
   * @example
   * // PUT /api/admin/users/:id/reset-password
   * // Body: { "newPassword": "temporal123" } o {} para generar automática
   */
  static async resetUserPassword(req, res) {
    try {
      const userId = req.params.id;
      let { newPassword } = req.body;

      // Si no se proporciona contraseña, generar una automática
      if (!newPassword) {
        newPassword = UserService.generateTemporaryPassword();
      }

      const result = await UserService.resetUserPassword(userId, newPassword);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en resetUserPassword:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}
