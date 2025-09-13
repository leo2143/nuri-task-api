import { TodoController } from './todoController.js';

// Función para configurar todas las rutas
export const setupRoutes = (app) => {
  // Ruta de bienvenida
  app.get('/', (req, res) => {
    res.json({
      message: '¡Bienvenido a la API de Todo List!',
      endpoints: {
        'GET /api/todos': 'Obtener todas las tareas',
        'GET /api/todos/:id': 'Obtener una tarea específica',
        'POST /api/todos': 'Crear una nueva tarea',
        'PUT /api/todos/:id': 'Actualizar una tarea',
        'DELETE /api/todos/:id': 'Eliminar una tarea'
      }
    });
  });

  // Rutas de la API de tareas
  app.get('/api/todos', TodoController.getAllTodos);
  app.get('/api/todos/:id', TodoController.getTodoById);
  app.post('/api/todos', TodoController.createTodo);
  app.put('/api/todos/:id', TodoController.updateTodo);
  app.delete('/api/todos/:id', TodoController.deleteTodo);
};
