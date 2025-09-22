import { TodoService } from '../../services/todoService.js';

// Controlador para manejar las rutas de las tareas
export class TodoController {
  // GET /api/todos - Obtener todas las tareas
  static getAllTodos(req, res) {
    const result = TodoService.getAllTodos();
    res.json(result);
  }

  // GET /api/todos/:id - Obtener una tarea específica
  static getTodoById(req, res) {
    const id = parseInt(req.params.id);
    const result = TodoService.getTodoById(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  }

  // POST /api/todos - Crear una nueva tarea
  static createTodo(req, res) {
    const result = TodoService.createTodo(req.body);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  }

  // PUT /api/todos/:id - Actualizar una tarea
  static updateTodo(req, res) {
    const id = parseInt(req.params.id);
    const result = TodoService.updateTodo(id, req.body);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  }

  // DELETE /api/todos/:id - Eliminar una tarea
  static deleteTodo(req, res) {
    const id = parseInt(req.params.id);
    const result = TodoService.deleteTodo(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  }
}
