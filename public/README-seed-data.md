# 📊 Datos de Prueba para MongoDB

Este archivo contiene datos de ejemplo para poblar la base de datos MongoDB con información de prueba.

## 📁 Archivos incluidos

- `users-data.json` - Usuarios en formato MongoDB
- `todos-data.json` - Tareas en formato MongoDB
- `goals-data.json` - Metas en formato MongoDB
- `README-seed-data.md` - Este archivo de instrucciones

## 🚀 Cómo usar los datos

### Opción 1: MongoDB Compass (Recomendado)

1. Abre MongoDB Compass
2. Conéctate a tu base de datos
3. Selecciona la colección (users, todos, o goals)
4. Haz clic en "Add Data" → "Import File"
5. Selecciona el archivo `seed-data.json`
6. Configura el mapeo de campos si es necesario
7. Importa los datos

### Opción 2: mongoimport (Terminal)

```bash
# Importar usuarios
mongoimport --db tu_base_de_datos --collection users --file seed-data.json --jsonArray

# Importar todos (después de ajustar los USER_IDs)
mongoimport --db tu_base_de_datos --collection todos --file seed-data.json --jsonArray

# Importar goals (después de ajustar los USER_IDs)
mongoimport --db tu_base_de_datos --collection goals --file seed-data.json --jsonArray
```

### Opción 3: Script de Node.js

```javascript
const fs = require('fs');
const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/tu_base_de_datos');

// Leer y cargar datos
const seedData = JSON.parse(fs.readFileSync('public/seed-data.json', 'utf8'));

// Cargar usuarios
await User.insertMany(seedData.users);

// Cargar todos (después de obtener los IDs reales)
await Todo.insertMany(seedData.todos);

// Cargar goals (después de obtener los IDs reales)
await Goal.insertMany(seedData.goals);
```

## ⚠️ Importante: Ajustar USER_IDs

**ANTES de importar todos y goals:**

1. Primero importa los usuarios
2. Obtén los ObjectIds reales de los usuarios creados
3. Reemplaza `USER_ID_1` y `USER_ID_2` en el archivo JSON con los IDs reales
4. Luego importa todos y goals

### Ejemplo de cómo obtener los IDs:

```javascript
// En MongoDB Compass o terminal
db.users.find({}, { _id: 1, name: 1, email: 1 });

// Resultado ejemplo:
// { "_id": ObjectId("507f1f77bcf86cd799439011"), "name": "Juan Pérez", "email": "juan@ejemplo.com" }
// { "_id": ObjectId("507f1f77bcf86cd799439012"), "name": "María García", "email": "maria@ejemplo.com" }
```

## 📋 Datos incluidos

### 👥 Usuarios (4)

- **Juan Pérez** - juan@ejemplo.com
- **María García** - maria@ejemplo.com
- **Carlos López** - carlos@ejemplo.com
- **Ana Martínez** - ana@ejemplo.com

**Contraseña para todos:** `123456` (hasheada con bcrypt)

### ✅ Todos (8)

- 6 tareas para Juan Pérez
- 2 tareas para María García
- Variedad de prioridades y estados
- Fechas de vencimiento realistas

### 🎯 Goals (7)

- 5 metas para Juan Pérez
- 2 metas para María García
- Criterios SMART completos
- Métricas de progreso semanal (simplificadas)
- Comentarios y feedback (simplificados)
- Diferentes estados: active, paused, completed

## 🔑 Credenciales de prueba

```
Email: juan@ejemplo.com
Password: 123456
```

## 📊 Estructura de los datos

### Users

```json
{
  "name": "string",
  "email": "string (unique)",
  "password": "string (bcrypt hashed)",
  "createdAt": "ISO Date",
  "updatedAt": "ISO Date"
}
```

### Todos

```json
{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high",
  "dueDate": "ISO Date",
  "completed": "boolean",
  "userId": "ObjectId (reference to User)",
  "createdAt": "ISO Date",
  "updatedAt": "ISO Date"
}
```

### Goals

```json
{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high",
  "dueDate": "ISO Date",
  "status": "active|paused|completed",
  "smart": {
    "specific": "string",
    "measurable": "string",
    "achievable": "string",
    "relevant": "string",
    "timeBound": "string"
  },
  "metrics": [
    {
      "week": "string",
      "progress": "number (0-100)",
      "notes": "string",
      "date": "ISO Date"
    }
  ],
  "comments": [
    {
      "text": "string",
      "author": "string",
      "date": "ISO Date"
    }
  ],
  "userId": "ObjectId (reference to User)",
  "createdAt": "ISO Date",
  "updatedAt": "ISO Date"
}
```

## 🧪 Probar los datos

Después de importar, puedes probar los endpoints:

```bash
# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "juan@ejemplo.com", "password": "123456"}'

# Obtener todos (con token)
curl -X GET http://localhost:3000/api/todos \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Obtener goals (con token)
curl -X GET http://localhost:3000/api/goals \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## 🔄 Limpiar datos

Para limpiar los datos de prueba:

```javascript
// En MongoDB Compass o terminal
db.users.deleteMany({});
db.todos.deleteMany({});
db.goals.deleteMany({});
```

## 📝 Notas adicionales

- Las contraseñas están hasheadas con bcrypt (salt rounds: 10)
- Todas las fechas están en formato ISO 8601
- Los ObjectIds son placeholders que deben ser reemplazados
- Los datos están diseñados para ser realistas y útiles para testing
- Incluye variedad de estados, prioridades y fechas para pruebas completas

---

**¡Disfruta probando tu API con estos datos de ejemplo! 🚀**
