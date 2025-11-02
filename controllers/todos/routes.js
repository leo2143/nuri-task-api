import { TodoController } from './todoController.js';
import { validateToken } from '../../middlewares/authMiddleware.js';

/**
 * Función para configurar las rutas de tareas (todos)
 * @function setupTodoRoutes
 * @param {Object} app - Instancia de Express
 * @returns {void} No retorna valor, configura las rutas de todos en la app
 * @description Configura todas las rutas relacionadas con tareas, todas requieren autenticación
 */
export const setupTodoRoutes = app => {
  app.get('/api/todos', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Obtiene todas las tareas del usuario'
    // #swagger.description = 'Retorna una lista de todas las tareas del usuario autenticado con filtros opcionales'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.getAllTodos(req, res);
  });

  app.get('/api/todos/completed', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Obtiene todas las tareas completadas'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.getCompletedTodos(req, res);
  });

  app.get('/api/todos/pending', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Obtiene todas las tareas pendientes'
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.getPendingTodos(req, res);
  });

  app.get('/api/todos/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Obtiene una tarea por su ID'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la tarea',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.getTodoById(req, res);
  });

  app.get('/api/todos/title/:title', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Busca una tarea por título'
    /* #swagger.parameters['title'] = {
         in: 'path',
         description: 'Título de la tarea',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.getByTitle(req, res);
  });

  app.get('/api/goals/:goalId/todos', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Obtiene todas las tareas de una meta específica'
    /* #swagger.parameters['goalId'] = {
         in: 'path',
         description: 'ID de la meta',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.getTodosByGoalId(req, res);
  });

  app.post('/api/todos', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Crea una nueva tarea'
    // #swagger.description = 'Crea una nueva tarea para el usuario autenticado'
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos de la tarea',
         required: true,
         schema: {
           title: 'Completar proyecto',
           description: 'Finalizar el módulo de autenticación',
           priority: 'high',
           dueDate: '2025-12-31T23:59:59.000Z'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.createTodo(req, res);
  });

  app.put('/api/todos/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Actualiza una tarea existente'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la tarea',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.updateTodo(req, res);
  });

  app.delete('/api/todos/:id', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Elimina una tarea'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la tarea',
         required: true,
         type: 'string'
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.deleteTodo(req, res);
  });

  app.post('/api/todos/:id/comments', validateToken, (req, res) => {
    // #swagger.tags = ['Todos']
    // #swagger.summary = 'Agrega un comentario a una tarea'
    /* #swagger.parameters['id'] = {
         in: 'path',
         description: 'ID de la tarea',
         required: true,
         type: 'string'
    } */
    /* #swagger.parameters['body'] = {
         in: 'body',
         description: 'Datos del comentario',
         required: true,
         schema: {
           text: 'Revisar validación',
           author: 'Juan Pérez'
         }
    } */
    /* #swagger.security = [{
         "bearerAuth": []
    }] */
    return TodoController.addCommentToTodo(req, res);
  });
};
