import { GoogleAuthController } from './googleAuthController.js';

export const setupAuthRoutes = app => {
  app.post('/api/auth/google', (req, res) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Inicia sesión o registra con Google OAuth'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Código de autorización de Google',
         required: true,
         schema: {
           code: '4/0AX4XfWj...'
         }
    } */
    return GoogleAuthController.googleLogin(req, res);
  });
};
