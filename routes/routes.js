import { setupTodoRoutes } from '../controllers/todos/routes.js';
import { setupUserRoutes } from '../controllers/users/routes.js';
import { notFoundHandler, errorHandler, healthCheck } from '../middlewares/errorMiddleware.js';

// Función principal para configurar todas las rutas
export const setupRoutes = (app) => {
  // Middleware de health check (global)
  app.use(healthCheck);
  
  // Ruta de bienvenida (global)
  app.get('/', (req, res) => { 
    res.json({
      message: '¡Bienvenido a la API de Todo List!',
      version: '1.0.0',
      endpoints: {
        todos: {
          'GET /api/todos': 'Obtener todas las tareas',
          'GET /api/todos/:id': 'Obtener una tarea específica',
          'POST /api/todos': 'Crear una nueva tarea',
          'PUT /api/todos/:id': 'Actualizar una tarea',
          'DELETE /api/todos/:id': 'Eliminar una tarea'
        },
        users: {
          'GET /api/users': 'Obtener todos los usuarios',
          'GET /api/users/:id': 'Obtener un usuario específico',
          'POST /api/users': 'Crear un nuevo usuario',
          'PUT /api/users/:id': 'Actualizar un usuario',
          'DELETE /api/users/:id': 'Eliminar un usuario'
        },
        system: {
          'GET /health': 'Verificar estado del servidor'
        }
      }
    });
  });

  // Configurar rutas específicas
  setupTodoRoutes(app);
  setupUserRoutes(app);
  
  // Middlewares globales (deben ir al final)
  app.use(notFoundHandler);
  app.use(errorHandler);
};
