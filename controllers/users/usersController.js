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

  /**
   * Solicita la recuperación de contraseña (endpoint público)
   * @static
   * @async
   * @function forgotPassword
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.body - Datos de la solicitud
   * @param {string} req.body.email - Email del usuario
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   * @description Genera un token y envía un email con instrucciones de recuperación
   * @example
   * // POST /api/users/forgot-password
   * // Body: { "email": "usuario@ejemplo.com" }
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: 'El email es requerido',
          status: 400,
          success: false,
        });
      }

      const result = await UserService.requestPasswordReset(email);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en forgotPassword:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Verifica si un token de recuperación es válido (endpoint público)
   * @static
   * @async
   * @function verifyResetToken
   * @param {Object} req - Objeto request de Express
   * @param {string} req.params.token - Token de recuperación
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   * @description Verifica que el token existe y no ha expirado
   * @example
   * // GET /api/users/verify-reset-token/:token
   */
  static async verifyResetToken(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          message: 'El token es requerido',
          status: 400,
          success: false,
        });
      }

      const result = await UserService.verifyResetToken(token);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en verifyResetToken:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }

  /**
   * Resetea la contraseña usando el token (endpoint público)
   * @static
   * @async
   * @function resetPassword
   * @param {Object} req - Objeto request de Express
   * @param {Object} req.body - Datos para resetear
   * @param {string} req.body.token - Token de recuperación
   * @param {string} req.body.newPassword - Nueva contraseña
   * @param {Object} res - Objeto response de Express
   * @returns {Promise<void>} No retorna valor, envía respuesta HTTP
   * @description Verifica el token y actualiza la contraseña
   * @example
   * // POST /api/users/reset-password
   * // Body: { "token": "abc123...", "newPassword": "nuevaContraseña123" }
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          message: 'El token y la nueva contraseña son requeridos',
          status: 400,
          success: false,
        });
      }

      const result = await UserService.resetPasswordWithToken(token, newPassword);
      res.status(result.status).json(result);
    } catch (error) {
      console.error('Error en resetPassword:', error);
      res.status(500).json({ message: 'Error interno del servidor', status: 500, success: false });
    }
  }
}
