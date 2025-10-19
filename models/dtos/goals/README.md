# DTOs de Goals

Este directorio contiene los Data Transfer Objects (DTOs) para el módulo de Goals.

## 📋 Descripción

Los DTOs proporcionan una capa de validación y transformación de datos entre el cliente y el servidor, asegurando que los datos sean correctos antes de procesarlos.

## 🎯 DTOs Disponibles

### 1. **CreateGoalDto**

Valida y estructura los datos para crear una nueva meta.

**Uso:**

```javascript
import { CreateGoalDto } from '../models/dtos/goals/index.js';

const createDto = new CreateGoalDto({
  title: 'Dominar Node.js',
  description: 'Convertirse en un desarrollador experto en Node.js',
  priority: 'high',
  status: 'active',
  dueDate: '2024-06-30',
  smart: {
    specific: 'Aprender Node.js, Express, MongoDB y JWT',
    measurable: 'Completar 5 proyectos y obtener certificación',
    achievable: '3 horas diarias de estudio y práctica',
    relevant: 'Necesario para avanzar en mi carrera',
    timeBound: '6 meses',
  },
});

// Validar
const validation = createDto.validate();
if (!validation.isValid) {
  console.error('Errores:', validation.errors);
  return;
}

// Obtener datos limpios
const cleanData = createDto.toPlainObject();
```

**Campos:**

- `title` (requerido): Título de la meta
- `description` (opcional): Descripción detallada
- `status` (opcional): Estado (`active`, `paused`, `completed`)
- `priority` (opcional): Prioridad (`low`, `medium`, `high`)
- `dueDate` (opcional): Fecha límite
- `smart` (requerido): Objeto con criterios SMART
  - `specific`: Criterio específico
  - `measurable`: Criterio medible
  - `achievable`: Criterio alcanzable
  - `relevant`: Criterio relevante
  - `timeBound`: Criterio con tiempo límite

---

### 2. **UpdateGoalDto**

Valida y estructura los datos para actualizar una meta existente. Todos los campos son opcionales.

**Uso:**

```javascript
import { UpdateGoalDto } from '../models/dtos/goals/index.js';

const updateDto = new UpdateGoalDto({
  status: 'completed',
  priority: 'low',
  smart: {
    timeBound: '3 meses', // Solo actualizar este campo de SMART
  },
});

const validation = updateDto.validate();
if (validation.isValid) {
  const cleanData = updateDto.toPlainObject();
  // cleanData solo contendrá los campos a actualizar
}
```

**Características:**

- Solo incluye los campos presentes en el objeto de entrada
- Valida cada campo individualmente
- Ideal para actualizaciones parciales

---

### 3. **AddCommentDto**

Valida y estructura los datos para agregar comentarios a una meta.

**Uso:**

```javascript
import { AddCommentDto } from '../models/dtos/goals/index.js';

const commentDto = new AddCommentDto({
  text: 'Excelente progreso en las primeras semanas',
  author: 'Mentor',
});

const validation = commentDto.validate();
if (validation.isValid) {
  const cleanComment = commentDto.toPlainObject();
}
```

**Campos:**

- `text` (requerido): Texto del comentario
- `author` (requerido): Nombre del autor
- `date` (opcional): Fecha del comentario (por defecto: ahora)

---

### 4. **GoalFilterDto**

Valida y construye queries de MongoDB para filtrar y ordenar metas.

**Uso:**

```javascript
import { GoalFilterDto } from '../models/dtos/goals/index.js';

const filterDto = new GoalFilterDto({
  status: 'active',
  priority: 'high',
  search: 'Node',
  dueDateFrom: '2024-01-01',
  dueDateTo: '2024-12-31',
  sortBy: 'dueDate',
  sortOrder: 'asc',
});

const validation = filterDto.validate();
if (validation.isValid) {
  const query = filterDto.toMongoQuery();
  const sort = filterDto.toMongoSort();

  // Usar en consultas MongoDB
  const goals = await Goal.find(query).sort(sort);
}
```

**Filtros disponibles:**

- `status`: Filtrar por estado (`active`, `paused`, `completed`)
- `priority`: Filtrar por prioridad (`low`, `medium`, `high`)
- `search`: Buscar en título y descripción (case-insensitive)
- `dueDateFrom`: Fecha límite desde
- `dueDateTo`: Fecha límite hasta
- `sortBy`: Ordenar por campo (`createdAt`, `updatedAt`, `dueDate`, `priority`, `title`)
- `sortOrder`: Orden (`asc`, `desc`)

**Métodos especiales:**

- `toMongoQuery()`: Genera un objeto query para MongoDB
- `toMongoSort()`: Genera un objeto sort para MongoDB

---

## 🔍 Validaciones

Todos los DTOs incluyen el método `validate()` que retorna:

```javascript
{
  isValid: boolean,
  errors: string[]
}
```

**Validaciones incluidas:**

- ✅ Tipos de datos correctos
- ✅ Campos requeridos presentes
- ✅ Valores enum válidos
- ✅ Formatos de fecha válidos
- ✅ Strings no vacíos
- ✅ Estructura de objetos anidados

---

## 📝 Ejemplo Completo en el Servicio

```javascript
import { CreateGoalDto, UpdateGoalDto, AddCommentDto, GoalFilterDto } from '../models/dtos/goals/index.js';
import Goal from '../models/goalsModel.js';

// Crear meta
static async createGoal(goalData, userId) {
  const createDto = new CreateGoalDto(goalData);
  const validation = createDto.validate();

  if (!validation.isValid) {
    return { error: validation.errors.join(', ') };
  }

  const cleanData = createDto.toPlainObject();
  const goal = new Goal({ ...cleanData, userId });
  return await goal.save();
}

// Actualizar meta
static async updateGoal(goalId, updateData, userId) {
  const updateDto = new UpdateGoalDto(updateData);
  const validation = updateDto.validate();

  if (!validation.isValid) {
    return { error: validation.errors.join(', ') };
  }

  const cleanData = updateDto.toPlainObject();
  return await Goal.findOneAndUpdate(
    { _id: goalId, userId },
    cleanData,
    { new: true }
  );
}

// Agregar comentario
static async addComment(goalId, commentData, userId) {
  const commentDto = new AddCommentDto(commentData);
  const validation = commentDto.validate();

  if (!validation.isValid) {
    return { error: validation.errors.join(', ') };
  }

  const cleanComment = commentDto.toPlainObject();
  return await Goal.findOneAndUpdate(
    { _id: goalId, userId },
    { $push: { comments: cleanComment } },
    { new: true }
  );
}

// Filtrar metas
static async getAllGoals(userId, filters) {
  const filterDto = new GoalFilterDto(filters);
  const validation = filterDto.validate();

  if (!validation.isValid) {
    return { error: validation.errors.join(', ') };
  }

  const query = { userId, ...filterDto.toMongoQuery() };
  const sort = filterDto.toMongoSort();

  return await Goal.find(query).sort(sort);
}
```

---

## 🚀 Beneficios

1. **Validación Centralizada**: Toda la lógica de validación en un solo lugar
2. **Reutilizable**: Los DTOs se pueden usar en controllers, services y tests
3. **Type Safety**: Estructura clara de datos esperados
4. **Documentado**: JSDoc completo para cada DTO
5. **Seguridad**: Previene inyección de datos no deseados
6. **Mantenible**: Fácil de actualizar si cambia el modelo

---

## 📚 API REST Ejemplos

### Crear meta

```bash
POST /api/goals
Content-Type: application/json

{
  "title": "Dominar Node.js",
  "description": "Convertirse en experto",
  "priority": "high",
  "smart": {
    "specific": "Aprender Node.js y Express",
    "measurable": "Completar 5 proyectos",
    "achievable": "3 horas diarias",
    "relevant": "Avanzar en carrera",
    "timeBound": "6 meses"
  }
}
```

### Actualizar meta

```bash
PUT /api/goals/:id
Content-Type: application/json

{
  "status": "completed",
  "priority": "low"
}
```

### Agregar comentario

```bash
POST /api/goals/:id/comments
Content-Type: application/json

{
  "text": "Excelente progreso",
  "author": "Mentor"
}
```

### Filtrar metas

```bash
GET /api/goals?status=active&priority=high&search=Node&sortBy=dueDate&sortOrder=asc
```

---

## ⚠️ Notas Importantes

- Los DTOs **no** guardan datos en la base de datos, solo validan y transforman
- Siempre validar antes de usar `toPlainObject()`
- Los errores de validación son descriptivos y en español
- Los campos opcionales tienen valores por defecto sensatos
- Los métodos `toPlainObject()` hacen `trim()` de strings automáticamente
