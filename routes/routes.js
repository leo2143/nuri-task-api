import { setupTodoRoutes } from '../controllers/todos/routes.js';
import { setupUserRoutes } from '../controllers/users/routes.js';
import { setupGoalRoutes } from '../controllers/goals/routes.js';
import { setupMetricRoutes } from '../controllers/metrics/routes.js';
import { setupMoodboardRoutes } from '../controllers/moodboard/routes.js';
import { setupAchievementRoutes } from '../controllers/achievements/routes.js';
import { notFoundHandler, errorHandler, healthCheck } from '../middlewares/errorMiddleware.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import swaggerUi from 'swagger-ui-express';

// Para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar swagger_output.json
const swaggerFile = JSON.parse(readFileSync(new URL('../swagger_output.json', import.meta.url)));

/**
 * Función principal para configurar todas las rutas de la aplicación
 * @function setupRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas en la app
 * @description Configura todas las rutas de la API, middlewares globales y manejo de errores
 */
export const setupRoutes = app => {
  // Health check endpoint
  app.get('/health', healthCheck);

  app.get('/', (req, res) => {
    const indexPath = join(__dirname, '..', 'public', 'index.html');
    res.sendFile(indexPath);
  });

  setupTodoRoutes(app);
  setupUserRoutes(app);
  setupGoalRoutes(app);
  setupMetricRoutes(app);
  setupMoodboardRoutes(app);
  setupAchievementRoutes(app);

  // Ruta para la documentación Swagger (configuración compatible con Vercel)
  const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css';

  const swaggerOptions = {
    customCssUrl: CSS_URL,
    customSiteTitle: 'Nuri Task API Documentation',
  };

  app.use('/api-docs', swaggerUi.serveFiles(swaggerFile, swaggerOptions), swaggerUi.setup(swaggerFile, swaggerOptions));

  // Middlewares globales (deben ir al final)
  app.use(notFoundHandler);
  app.use(errorHandler);
};
