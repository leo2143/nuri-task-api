let todos = [
  { id: 1, title: 'Aprender Node.js', completed: false },
  { id: 2, title: 'Crear una API REST', completed: true },
  { id: 3, title: 'Practicar con Express', completed: false }
];

// Servicio para manejar la lógica de negocio de las tareas
export class TodoService {
  // Obtener todas las tareas
  static getAllTodos() {
    return {
      success: true,
      data: todos,
      count: todos.length
    };
  }

  // Obtener una tarea específica por ID
  static getTodoById(id) {
    const todo = todos.find(t => t.id === id);
    
    if (!todo) {
      return {
        status: 404,
        success: false,
        message: 'Tarea no encontrada'
      };
    }
    
    return {
      status: 200,
      success: true,
      data: todo
    };
  }

  // Crear una nueva tarea
  static createTodo(todoData) {
    const { title } = todoData;
    
    if (!title) {
      return {
        status: 400,
        success: false,
        message: 'El título es requerido'
      };
    }
    
    const newTodo = {
      id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1,
      title,
      completed: false
    };
    
    todos.push(newTodo);
    
    return {
      status: 201,
      success: true,
      data: newTodo,
      message: 'Tarea creada exitosamente'
    };
  }

  // Actualizar una tarea existente
  static updateTodo(id, updateData) {
    const { title, completed } = updateData;
    
    const todoIndex = todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return {
        status: 404,
        success: false,
        message: 'Tarea no encontrada'
      };
    }
    
    // Actualizar solo los campos proporcionados
    if (title !== undefined) todos[todoIndex].title = title;
    if (completed !== undefined) todos[todoIndex].completed = completed;
    
    return {
      status: 200,
      success: true,
      data: todos[todoIndex],
      message: 'Tarea actualizada exitosamente'
    };
  }

  // Eliminar una tarea
  static deleteTodo(id) {
    const todoIndex = todos.findIndex(t => t.id === id);
    
    if (todoIndex === -1) {
      return {
        status: 404,
        success: false,
        message: 'Tarea no encontrada'
      };
    }
    
    const deletedTodo = todos.splice(todoIndex, 1)[0];
    
    return {
      status: 200,
      success: true,
      data: deletedTodo,
      message: 'Tarea eliminada exitosamente'
    };
  }
}
