import { setupTodoRoutes } from '../controllers/todos/routes.js';
import { setupUserRoutes } from '../controllers/users/routes.js';
import { setupGoalRoutes } from '../controllers/goals/routes.js';
import { setupMetricRoutes } from '../controllers/metrics/routes.js';
import { notFoundHandler, errorHandler, healthCheck } from '../middlewares/errorMiddleware.js';

/**
 * Función principal para configurar todas las rutas de la aplicación
 * @function setupRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas en la app
 * @description Configura todas las rutas de la API, middlewares globales y manejo de errores
 * @example
 * // En index.js
 * import { setupRoutes } from './routes/routes.js';
 * setupRoutes(app);
 */
export const setupRoutes = app => {
  // Middleware de health check (global)
  app.use(healthCheck);

  // Ruta de bienvenida (global) - Ahora sirve la página HTML
  app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
  });

  // Ruta para la documentación JSDoc
  app.get('/docs', (req, res) => {
    res.sendFile('index.html', { root: 'docs' });
  });

  // Configurar rutas específicas
  setupTodoRoutes(app);
  setupUserRoutes(app);
  setupGoalRoutes(app);
  setupMetricRoutes(app);

  // Middlewares globales (deben ir al final)
  app.use(notFoundHandler);
  app.use(errorHandler);
};
