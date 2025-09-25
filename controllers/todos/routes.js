import { TodoController } from './todoController.js';
import { validarToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de tareas (todos)
 * @function setupTodoRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de todos en la app
 * @description Configura todas las rutas relacionadas con tareas, todas requieren autenticación
 */
export const setupTodoRoutes = app => {
  app.get('/api/todos', validarToken, TodoController.getAllTodos);
  app.get('/api/todos/completed', validarToken, TodoController.getCompletedTodos);
  app.get('/api/todos/pending', validarToken, TodoController.getPendingTodos);
  app.get('/api/todos/:id', validarToken, TodoController.getTodoById);
  app.get('/api/todos/title/:title', validarToken, TodoController.getByTitle);
  app.post('/api/todos', validarToken, TodoController.createTodo);
  app.put('/api/todos/:id', validarToken, TodoController.updateTodo);
  app.delete('/api/todos/:id', validarToken, TodoController.deleteTodo);
};
