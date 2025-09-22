import { TodoController } from './todoController.js';
import { validarToken } from '../../middlewares/authMiddleware.js';

// Función para configurar las rutas de todos
export const setupTodoRoutes = (app) => {
  // Rutas de la API de tareas
  app.get('/api/todos', TodoController.getAllTodos);
  app.get('/api/todos/:id', validarToken, TodoController.getTodoById);
  app.post('/api/todos', validarToken, TodoController.createTodo);
  app.put('/api/todos/:id', validarToken, TodoController.updateTodo);
  app.delete('/api/todos/:id', validarToken, TodoController.deleteTodo);
  

};
