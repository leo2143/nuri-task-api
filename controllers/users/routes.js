import { UsersController } from './usersController.js';
import { validarToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de usuarios
 * @function setupUserRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de usuarios en la app
 * @description Configura las rutas de usuarios, algunas públicas (login, registro) y otras protegidas
 */
export const setupUserRoutes = app => {
  app.post('/api/users/login', UsersController.loginUser);

  app.post('/api/users', UsersController.createUser);

  app.get('/api/users', validarToken, UsersController.getAllUsers);
  app.get('/api/users/:id', validarToken, UsersController.getUserById);
  app.put('/api/users/:id', validarToken, UsersController.updateUser);
  app.delete('/api/users/:id', validarToken, UsersController.deleteUser);
};
