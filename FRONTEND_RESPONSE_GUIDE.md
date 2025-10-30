# 📘 Guía de Respuestas de la API para Frontend

Este documento describe todos los modelos de respuesta de la API y cómo manejarlos en el frontend.

## 📋 Estructura General de Respuestas

Todas las respuestas de la API siguen esta estructura base:

```json
{
  "success": boolean,
  "status": number,
  "message": string,
  "data": any | null
}
```

## ✅ Respuestas Exitosas

### 1. **SuccessResponseModel** (200 OK)

Operación exitosa con datos.

**Ejemplo - Obtener usuarios:**
```json
{
  "success": true,
  "status": 200,
  "message": "Usuarios obtenidos correctamente",
  "data": [...],
  "count": 5
}
```

**Cómo manejarlo en el frontend:**
```javascript
if (response.success && response.status === 200) {
  console.log('Datos:', response.data);
  // Renderizar datos
}
```

---

### 2. **CreatedResponseModel** (201 Created)

Recurso creado exitosamente.

**Ejemplo - Crear usuario:**
```json
{
  "success": true,
  "status": 201,
  "message": "Usuario creado correctamente",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com"
  }
}
```

**Cómo manejarlo en el frontend:**
```javascript
if (response.status === 201) {
  console.log('Usuario creado:', response.data);
  // Redirigir a login o dashboard
  showSuccessMessage(response.message);
}
```

---

## ❌ Respuestas de Error

### 3. **BadRequestResponseModel** (400 Bad Request)

Solicitud incorrecta - datos inválidos o faltantes.

**Ejemplo - Validación fallida:**
```json
{
  "success": false,
  "status": 400,
  "message": "Error de validación: El email es requerido",
  "details": {
    "field": "email",
    "error": "required"
  }
}
```

**Cómo manejarlo en el frontend:**
```javascript
if (response.status === 400) {
  // Mostrar errores de validación en el formulario
  showValidationErrors(response.message);
  if (response.details) {
    highlightField(response.details.field);
  }
}
```

**Casos comunes:**
- Campos requeridos faltantes
- Formato de email inválido
- Contraseña muy corta
- Datos de tipo incorrecto

---

### 4. **NotFoundResponseModel** (404 Not Found)

Recurso no encontrado.

**Ejemplo - Usuario no existe:**
```json
{
  "success": false,
  "status": 404,
  "message": "No se encontró el usuario con el id: 507f1f77bcf86cd799439011"
}
```

**Cómo manejarlo en el frontend:**
```javascript
if (response.status === 404) {
  showErrorMessage('Recurso no encontrado');
  // Redirigir a página de error 404
  router.push('/404');
}
```

**Casos comunes:**
- Usuario no existe
- Todo no encontrado
- Meta no encontrada
- ID inválido

---

### 5. **ConflictResponseModel** (409 Conflict) ⭐ NUEVO

Conflicto con recursos existentes - unicidad violada.

**Ejemplo - Email duplicado:**
```json
{
  "success": false,
  "status": 409,
  "message": "El email ya está registrado. Por favor, utiliza otro email o inicia sesión.",
  "conflict": {
    "field": "email",
    "value": "juan@ejemplo.com"
  }
}
```

**Cómo manejarlo en el frontend:**
```javascript
if (response.status === 409) {
  // Mostrar mensaje específico del conflicto
  showErrorMessage(response.message);
  
  // Resaltar el campo en conflicto
  if (response.conflict?.field) {
    highlightField(response.conflict.field);
    showFieldError(response.conflict.field, 'Ya existe un usuario con este email');
  }
  
  // Opcional: Ofrecer alternativas
  if (response.conflict?.field === 'email') {
    showLoginOption(); // "¿Ya tienes cuenta? Inicia sesión"
  }
}
```

**Casos comunes:**
- Email duplicado al registrar usuario
- Email duplicado al actualizar usuario
- Username duplicado (si implementas)
- Cualquier campo con restricción de unicidad

---

### 6. **ErrorResponseModel** (500 Internal Server Error)

Error interno del servidor.

**Ejemplo - Error inesperado:**
```json
{
  "success": false,
  "status": 500,
  "message": "Error al crear usuario"
}
```

**Cómo manejarlo en el frontend:**
```javascript
if (response.status === 500) {
  showErrorMessage('Ha ocurrido un error. Por favor, intenta nuevamente.');
  // Log del error para debugging
  console.error('Server error:', response.message);
  
  // Opcional: Enviar reporte de error
  sendErrorReport(response);
}
```

**Casos comunes:**
- Error de base de datos
- Error de conexión
- Error en la lógica del servidor
- Cualquier error inesperado

---

## 🔐 Ejemplos Específicos por Endpoint

### **Registro de Usuario** - `POST /api/users`

#### ✅ Éxito (201)
```json
{
  "success": true,
  "status": 201,
  "message": "Usuario creado correctamente",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com"
  }
}
```

#### ❌ Email duplicado (409) - NUEVO
```json
{
  "success": false,
  "status": 409,
  "message": "El email ya está registrado. Por favor, utiliza otro email o inicia sesión.",
  "conflict": {
    "field": "email",
    "value": "juan@ejemplo.com"
  }
}
```

#### ❌ Validación fallida (400)
```json
{
  "success": false,
  "status": 400,
  "message": "Error de validación: El nombre es requerido"
}
```

#### ❌ Error del servidor (500)
```json
{
  "success": false,
  "status": 500,
  "message": "Error al crear usuario"
}
```

---

### **Login** - `POST /api/users/login`

#### ✅ Éxito (200)
```json
{
  "success": true,
  "status": 200,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Juan Pérez",
      "email": "juan@ejemplo.com"
    }
  },
  "count": 1
}
```

#### ❌ Credenciales inválidas (500)
```json
{
  "success": false,
  "status": 500,
  "message": "Credenciales inválidas"
}
```

---

### **Recuperación de Contraseña** - `POST /api/users/forgot-password`

#### ✅ Éxito (200)
```json
{
  "success": true,
  "status": 200,
  "message": "Email de recuperación enviado",
  "data": {
    "message": "Si el email existe, recibirás un correo con instrucciones"
  },
  "count": 1
}
```

#### ❌ Email requerido (400)
```json
{
  "success": false,
  "status": 400,
  "message": "El email es requerido"
}
```

---

### **Resetear Contraseña** - `POST /api/users/reset-password`

#### ✅ Éxito (200)
```json
{
  "success": true,
  "status": 200,
  "message": "Contraseña reseteada correctamente",
  "data": {
    "message": "Contraseña actualizada exitosamente",
    "email": "juan@ejemplo.com"
  },
  "count": 1
}
```

#### ❌ Token inválido o expirado (500)
```json
{
  "success": false,
  "status": 500,
  "message": "Token inválido o expirado"
}
```

#### ❌ Contraseña muy corta (500)
```json
{
  "success": false,
  "status": 500,
  "message": "La contraseña debe tener al menos 6 caracteres"
}
```

---

### **Actualizar Usuario** - `PUT /api/users/:id`

#### ✅ Éxito (200)
```json
{
  "success": true,
  "status": 200,
  "message": "Usuario actualizado correctamente",
  "data": {...},
  "count": 1
}
```

#### ❌ Email en uso (409) - NUEVO
```json
{
  "success": false,
  "status": 409,
  "message": "El email ya está en uso por otro usuario. Por favor, utiliza otro email.",
  "conflict": {
    "field": "email",
    "value": "otro@ejemplo.com"
  }
}
```

#### ❌ Usuario no encontrado (404)
```json
{
  "success": false,
  "status": 404,
  "message": "No se encontró el usuario con el id: 507f1f77bcf86cd799439011"
}
```

---

## 🎨 Manejador Universal de Respuestas (React/Vue/Angular)

### React Example

```javascript
// utils/apiResponseHandler.js
export const handleApiResponse = (response, options = {}) => {
  const {
    onSuccess,
    onConflict,
    onNotFound,
    onBadRequest,
    onError
  } = options;

  switch (response.status) {
    case 200:
    case 201:
      if (onSuccess) onSuccess(response.data, response.message);
      return { success: true, data: response.data };

    case 400:
      if (onBadRequest) onBadRequest(response.message, response.details);
      return { success: false, error: response.message, type: 'validation' };

    case 404:
      if (onNotFound) onNotFound(response.message);
      return { success: false, error: response.message, type: 'notFound' };

    case 409: // NUEVO - Manejo de conflictos
      if (onConflict) onConflict(response.message, response.conflict);
      return { 
        success: false, 
        error: response.message, 
        type: 'conflict',
        field: response.conflict?.field,
        value: response.conflict?.value
      };

    case 500:
    default:
      if (onError) onError(response.message);
      return { success: false, error: response.message, type: 'server' };
  }
};

// Uso en componente
const handleRegister = async (userData) => {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    handleApiResponse(data, {
      onSuccess: (user, message) => {
        toast.success(message);
        navigate('/dashboard');
      },
      onConflict: (message, conflict) => {
        // NUEVO - Manejo específico de conflictos
        toast.error(message);
        if (conflict?.field === 'email') {
          setEmailError('Este email ya está registrado');
          setShowLoginLink(true);
        }
      },
      onBadRequest: (message) => {
        toast.error(message);
      },
      onError: (message) => {
        toast.error('Error al crear usuario. Intenta nuevamente.');
      }
    });
  } catch (error) {
    console.error('Network error:', error);
    toast.error('Error de conexión');
  }
};
```

---

### Vue Example

```javascript
// composables/useApiResponse.js
export const useApiResponse = () => {
  const handleResponse = (response) => {
    switch (response.status) {
      case 200:
      case 201:
        return { success: true, data: response.data };
      
      case 409: // NUEVO
        return {
          success: false,
          error: response.message,
          type: 'conflict',
          conflict: response.conflict
        };
      
      case 404:
        return { success: false, error: response.message, type: 'notFound' };
      
      case 400:
        return { success: false, error: response.message, type: 'validation' };
      
      default:
        return { success: false, error: response.message, type: 'server' };
    }
  };

  return { handleResponse };
};
```

---

## 📊 Tabla de Referencia Rápida

| Código | Modelo | Significado | Acción Frontend |
|--------|--------|-------------|-----------------|
| **200** | SuccessResponseModel | Éxito | Mostrar datos |
| **201** | CreatedResponseModel | Recurso creado | Redirigir/Confirmar |
| **400** | BadRequestResponseModel | Datos inválidos | Mostrar errores de validación |
| **404** | NotFoundResponseModel | No encontrado | Mostrar página 404 |
| **409** | ConflictResponseModel | Conflicto (duplicado) ⭐ | Resaltar campo, sugerir alternativas |
| **500** | ErrorResponseModel | Error servidor | Mensaje genérico + retry |

---

## 🚀 Mejores Prácticas

### 1. **Siempre verificar el campo `success`**
```javascript
if (response.success) {
  // Manejar éxito
} else {
  // Manejar error según status
}
```

### 2. **Manejo específico del código 409 (Conflicto)**
```javascript
if (response.status === 409) {
  const { field, value } = response.conflict;
  
  // Resaltar el campo específico
  setFieldError(field, response.message);
  
  // Ofrecer soluciones
  if (field === 'email') {
    showAlternatives(['Usar otro email', 'Iniciar sesión', 'Recuperar contraseña']);
  }
}
```

### 3. **Guardar el token en localStorage solo si es exitoso**
```javascript
if (response.success && response.data?.token) {
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
}
```

### 4. **Mostrar mensajes user-friendly**
```javascript
const userFriendlyMessages = {
  409: 'Este correo ya está en uso. ¿Ya tienes cuenta?',
  500: 'Algo salió mal. Por favor, intenta nuevamente.',
  404: 'No encontramos lo que buscas.',
  400: 'Por favor, verifica los datos ingresados.'
};

showToast(userFriendlyMessages[response.status] || response.message);
```

### 5. **Log de errores para debugging**
```javascript
if (!response.success) {
  console.error('API Error:', {
    status: response.status,
    message: response.message,
    endpoint: endpoint,
    timestamp: new Date().toISOString()
  });
}
```

---

## 📝 Checklist para Desarrolladores Frontend

Cuando consumes un endpoint, asegúrate de manejar:

- [ ] ✅ Respuesta exitosa (200/201)
- [ ] ❌ Error de validación (400)
- [ ] ❌ Recurso no encontrado (404)
- [ ] ⚠️ Conflicto de unicidad (409) - **Especialmente en registro/actualización**
- [ ] ❌ Error del servidor (500)
- [ ] 🔌 Error de red/conexión
- [ ] ⏳ Estados de carga
- [ ] 🔄 Reintentos si es necesario

---

## 🎯 Ejemplo Completo de Formulario de Registro

```javascript
const RegisterForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showLoginLink, setShowLoginLink] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setShowLoginLink(false);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // ✅ Éxito (201)
        toast.success(data.message);
        navigate('/login');
      } else {
        // ❌ Error
        switch (data.status) {
          case 409:
            // ⚠️ Email duplicado - NUEVO
            setErrors({ 
              email: data.message 
            });
            setShowLoginLink(true);
            toast.error(data.message);
            break;

          case 400:
            // Validación fallida
            setErrors({ 
              general: data.message 
            });
            toast.error(data.message);
            break;

          default:
            // Error del servidor
            toast.error('Error al crear usuario. Intenta nuevamente.');
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Nombre"
      />

      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        className={errors.email ? 'error' : ''}
      />
      {errors.email && <span className="error-message">{errors.email}</span>}

      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Contraseña"
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Registrando...' : 'Registrar'}
      </button>

      {showLoginLink && (
        <div className="login-suggestion">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </div>
      )}

      {errors.general && <div className="error-alert">{errors.general}</div>}
    </form>
  );
};
```

---

## 📦 Ejemplos Adicionales por Módulo

### **Todos (Tareas)**

#### Crear Todo con validación fallida (400)
```json
// POST /api/todos con datos inválidos
{
  "success": false,
  "status": 400,
  "message": "El título es requerido, La prioridad debe ser baja, media o alta"
}
```

#### Actualizar Todo con validación fallida (400)
```json
// PUT /api/todos/:id con datos inválidos
{
  "success": false,
  "status": 400,
  "message": "El estado debe ser: pending, in-progress o completed"
}
```

---

### **Goals (Metas)**

#### Crear Goal con validación fallida (400)
```json
// POST /api/goals con datos inválidos
{
  "success": false,
  "status": 400,
  "message": "El título es requerido, La fecha de inicio no puede ser anterior a hoy"
}
```

#### Goal no encontrada (404)
```json
// GET /api/goals/:id con ID inexistente
{
  "success": false,
  "status": 404,
  "message": "No se encontró la meta con el id: 507f1f77bcf86cd799439011"
}
```

---

### **Achievements (Logros)**

#### Crear Achievement con validación fallida (400)
```json
// POST /api/achievements con datos inválidos
{
  "success": false,
  "status": 400,
  "message": "El nombre es requerido, El tipo debe ser: task, streak o milestone"
}
```

---

### **Moodboard**

#### Agregar imagen con validación fallida (400)
```json
// POST /api/moodboards/:id/images con datos inválidos
{
  "success": false,
  "status": 400,
  "message": "La URL de la imagen es requerida, La URL debe tener formato válido"
}
```

---

### **Metrics (Métricas)**

#### Actualizar métrica con validación fallida (400)
```json
// PUT /api/metrics/:id con datos inválidos
{
  "success": false,
  "status": 400,
  "message": "El valor actual debe ser un número, El valor no puede ser negativo"
}
```

---

## 🎯 Resumen de Cambios Aplicados

### Todos los servicios ahora usan:

| Servicio | Cambios Aplicados |
|----------|-------------------|
| **UserService** | ✅ ConflictResponseModel (409) para emails duplicados<br>✅ BadRequestResponseModel (400) para validaciones |
| **TodoService** | ✅ BadRequestResponseModel (400) para validaciones |
| **GoalService** | ✅ BadRequestResponseModel (400) para validaciones |
| **AchievementService** | ✅ BadRequestResponseModel (400) para validaciones |
| **MoodboardService** | ✅ BadRequestResponseModel (400) para validaciones |
| **MetricService** | ✅ BadRequestResponseModel (400) para validaciones |
| **UserAchievementService** | ✅ BadRequestResponseModel (400) para validaciones |

### Beneficios:
- ✅ Códigos HTTP correctos y semánticos
- ✅ Frontend puede distinguir entre tipos de error
- ✅ Mejor experiencia de usuario
- ✅ Validación consistente en toda la API

---

## 🔗 Referencias

- [Códigos de Estado HTTP - MDN](https://developer.mozilla.org/es/docs/Web/HTTP/Status)
- Documentación de la API: `README.md`
- Ejemplos de uso: `PASSWORD_RECOVERY_EXAMPLES.md`
- Configuración de email: `EMAIL_SETUP.md`

---

**¿Preguntas?** Contacta al equipo de backend o revisa la documentación completa de la API.

