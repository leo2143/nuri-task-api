import { UsersController } from './usersController.js';
import { validateAdminToken, validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de usuarios
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de usuarios en la app
   * Configura las rutas de usuarios, algunas públicas (login, registro) y otras protegidas
 */
export const setupUserRoutes = app => {
  app.post('/api/users/login', (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Inicia sesión de usuario'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Credenciales de usuario',
         required: true,
         schema: {
           email: 'juan@example.com',
           password: 'password123'
         }
    } */
    return UsersController.loginUser(req, res);
  });

  app.post('/api/users', (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Registra un nuevo usuario'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos del nuevo usuario',
         required: true,
         schema: {
           username: 'juanperez',
           email: 'juan@example.com',
           password: 'password123'
         }
    } */
    return UsersController.createUser(req, res);
  });

  app.post('/api/admin/users', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Users - Admin']
    // #swagger.summary = 'Crea un usuario con control completo (solo admin)'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos completos del usuario con control de admin y suscripción',
         required: true,
         schema: {
           name: 'Juan Pérez',
           email: 'juan@example.com',
           password: 'password123',
           isAdmin: false,
           isSubscribed: true,
           profileImageUrl: 'https://example.com/avatar.jpg'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.createAdminUser(req, res);
  });

  app.post('/api/users/forgot-password', (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Solicita recuperación de contraseña'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Email del usuario',
         required: true,
         schema: {
           email: 'juan@example.com'
         }
    } */
    return UsersController.forgotPassword(req, res);
  });

  app.get('/api/users/verify-reset-token/:token', (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Verifica si el token de recuperación es válido'
    /* #swagger.parameters['token'] = {
         in: 'path',
         description: 'Token de recuperación',
         required: true,
         type: 'string'
    } */
    return UsersController.verifyResetToken(req, res);
  });

  app.post('/api/users/reset-password', (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Restablece la contraseña con el token'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Token y nueva contraseña',
         required: true,
         schema: {
           token: 'abc123def456',
           newPassword: 'newPassword123'
         }
    } */
    return UsersController.resetPassword(req, res);
  });

  app.put('/api/users/change-password', validateToken, (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Cambia la contraseña del usuario autenticado'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Contraseña actual y nueva',
         required: true,
         schema: {
           currentPassword: 'oldPassword123',
           newPassword: 'newPassword456'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.changePassword(req, res);
  });

  app.get('/api/user/profile', validateToken, (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Obtiene el perfil del usuario autenticado'
    // #swagger.description = 'Retorna: name, email, subscription (isActive, startDate, endDate), profileImageUrl'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.getProfile(req, res);
  });

  app.put('/api/user/profile-image', validateToken, (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Actualiza solo la foto de perfil del usuario autenticado'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'URL de la nueva imagen de perfil',
         required: true,
         schema: {
           profileImageUrl: 'https://example.com/new-avatar.jpg'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.updateProfileImage(req, res);
  });

  app.delete('/api/user/profile-image', validateToken, (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Elimina la foto de perfil del usuario autenticado'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.deleteProfileImage(req, res);
  });

  app.get('/api/users', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Obtiene todos los usuarios (solo admin)'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.getAllUsers(req, res);
  });

  app.get('/api/users/:id', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Obtiene un usuario por ID (solo admin)'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del usuario',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.getUserById(req, res);
  });

  app.put('/api/users/:id', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Actualiza un usuario (solo admin)'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del usuario',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.updateUser(req, res);
  });

  app.put('/api/admin/users/:id', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Users - Admin']
    // #swagger.summary = 'Actualiza un usuario con control completo (solo admin)'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del usuario',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos a actualizar (todos opcionales)',
         required: false,
         schema: {
           name: 'Juan Pérez Updated',
           email: 'juan.updated@example.com',
           password: 'newPassword123',
           isAdmin: true,
           isSubscribed: true,
           profileImageUrl: 'https://example.com/new-avatar.jpg'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.updateAdminUser(req, res);
  });

  app.delete('/api/users/:id', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Elimina un usuario (solo admin)'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del usuario',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.deleteUser(req, res);
  });

  app.put('/api/admin/users/:id/reset-password', validateAdminToken, (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Resetea la contraseña de un usuario (solo admin)'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID del usuario',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Nueva contraseña',
         required: true,
         schema: {
           newPassword: 'newPassword123'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return UsersController.resetUserPassword(req, res);
  });
};
