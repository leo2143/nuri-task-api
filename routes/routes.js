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
import express from 'express';

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

  // Servir archivos estáticos de Swagger UI
  app.use('/swagger-ui', express.static(join(__dirname, '..', 'public', 'swagger-ui')));

  // Servir el archivo swagger.json dinámicamente
  app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerFile);
  });

  // Redirigir /api-docs a la UI de Swagger
  app.get('/api-docs', (req, res) => {
    res.redirect('/swagger-ui/');
  });

  // Middlewares globales (deben ir al final)
  app.use(notFoundHandler);
  app.use(errorHandler);
};
