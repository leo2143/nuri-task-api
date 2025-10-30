import { UsersController } from './usersController.js';
import { validarAdminToken, validarToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de usuarios
 * @function setupUserRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de usuarios en la app
 * @description Configura las rutas de usuarios, algunas públicas (login, registro) y otras protegidas
 */
export const setupUserRoutes = app => {
  // Rutas públicas
  app.post('/api/users/login', UsersController.loginUser);
  app.post('/api/users', UsersController.createUser);

  // Rutas públicas para recuperación de contraseña
  app.post('/api/users/forgot-password', UsersController.forgotPassword);
  app.get('/api/users/verify-reset-token/:token', UsersController.verifyResetToken);
  app.post('/api/users/reset-password', UsersController.resetPassword);

  // Rutas protegidas con autenticación normal
  app.put('/api/users/change-password', validarToken, UsersController.changePassword);

  // Rutas protegidas con permisos de admin
  app.get('/api/users', validarAdminToken, UsersController.getAllUsers);
  app.get('/api/users/:id', validarAdminToken, UsersController.getUserById);
  app.put('/api/users/:id', validarAdminToken, UsersController.updateUser);
  app.delete('/api/users/:id', validarAdminToken, UsersController.deleteUser);

  // Ruta admin para resetear contraseñas
  app.put('/api/admin/users/:id/reset-password', validarAdminToken, UsersController.resetUserPassword);
};
