import { UsersController } from './usersController.js';
import { validarToken } from '../../middlewares/authMiddleware.js';

// Función para configurar las rutas de usuarios
export const setupUserRoutes = (app) => {
  // Rutas de la API de usuarios

  app.post('/api/users', UsersController.createUser);

  app.get('/api/users', UsersController.getAllUsers);
  app.get('/api/users/:id', UsersController.getUserById);
  app.put('/api/users/:id', UsersController.updateUser);
  app.delete('/api/users/:id', UsersController.deleteUser);

};
