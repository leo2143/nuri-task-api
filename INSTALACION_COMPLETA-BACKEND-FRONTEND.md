# 🌸 Nuri Task - Guía de Instalación Completa

![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)
![React](https://img.shields.io/badge/React-v19-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-v8.18.1-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue.svg)

---

## 💚 Acerca del Proyecto

**Nuri Task** es una aplicación web fullstack (MERN Stack) para gestión de tareas y metas, diseñada para ayudarte a construir hábitos y cumplir objetivos de una forma emocionalmente acompañada, sin presión y sin culpas.

> **Estado del Proyecto:** Este proyecto está en etapa inicial de desarrollo. El **backend** cuenta con funcionalidades completas (autenticación, tareas, metas, logros, métricas y moodboards), mientras que el **frontend** actualmente implementa las funcionalidades base de autenticación, gestión de tareas y gestión de metas. Funcionalidades como logros, métricas y moodboards están disponibles en la API pero pendientes de implementación en la interfaz de usuario.

### Funcionalidades Implementadas (Frontend + Backend)

#### 🔐 Autenticación y Seguridad ✅

- ✅ Sistema completo de autenticación con JWT
- ✅ Registro de usuarios con validación
- ✅ Login con persistencia de sesión
- ✅ Recuperación de contraseña por email
- ✅ Reset de contraseña con token
- ✅ Rutas protegidas con redirección automática

#### ✅ Gestión de Tareas (Todos) ✅

- ✅ CRUD completo (crear, listar, ver detalle, editar, eliminar)
- ✅ Prioridades (low, medium, high)
- ✅ Estados y fechas de vencimiento
- ✅ Marcar como completada/incompleta (checkbox interactivo)
- ✅ Vinculación con metas
- ⚠️ Sistema de comentarios (solo backend, no implementado en frontend)

#### 🎯 Gestión de Metas (Goals) ✅

- ✅ CRUD completo (crear, listar, ver detalle, editar, eliminar)
- ✅ Criterios SMART (específico, medible, alcanzable, relevante, tiempo límite)
- ✅ Estados personalizables (active, paused, completed)
- ✅ Jerarquía de metas y submetas
- ✅ Catálogo de metas para selección
- ✅ Progreso automático calculado en base a tareas
- ⚠️ Sistema de comentarios (solo backend, no implementado en frontend)

#### 🏆 Logros y Métricas ⚠️

- ⚠️ **No implementado en frontend** (solo API backend disponible)
- Sistema de achievements con desbloqueo automático
- Métricas de progreso y rachas (streaks)
- Historial de actividad

#### 🎨 Moodboards ⚠️

- ⚠️ **No implementado en frontend** (solo API backend disponible)
- Tableros de inspiración con imágenes y frases
- Vinculación con metas

#### 📚 Documentación

- API documentada con Swagger UI
- Colección de Postman incluida

### Resumen de Implementación

| Funcionalidad              | Backend     | Frontend     |
| -------------------------- | ----------- | ------------ |
| Autenticación y Seguridad  | ✅ Completo | ✅ Completo  |
| Gestión de Tareas          | ✅ Completo | ✅ Completo  |
| Gestión de Metas           | ✅ Completo | ✅ Completo  |
| Comentarios (Tareas/Metas) | ✅ Completo | ⚠️ Pendiente |
| Logros (Achievements)      | ✅ Completo | ⚠️ Pendiente |
| Métricas y Rachas          | ✅ Completo | ⚠️ Pendiente |
| Moodboards                 | ✅ Completo | ⚠️ Pendiente |

---

## 🚀 Stack Tecnológico

**Frontend:**

- React 19 + TypeScript
- Vite + Tailwind CSS
- React Router v6 + Context API
- Axios

**Backend:**

- Node.js v20 + Express v5
- MongoDB + Mongoose v8
- JWT + Bcrypt
- Nodemailer + Swagger UI

---

## 📋 Requisitos Previos

- Node.js v20 o superior
- npm v10 o superior
- MongoDB v6.0+ (local o MongoDB Atlas)
- Git

---

## 📦 Instalación del Backend

### 1. Clonar el repositorio

```bash
git clone https://github.com/leo2143/nuri-task-api.git
cd nuri-task-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Coloca el archivo `.env` proporcionado en la raíz del proyecto. Debe contener:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/nuri-task-db

# JWT
JWT_SECRET=tu_clave_secreta

# Servidor
PORT=8888
NODE_ENV=development

# Email (Gmail con contraseña de aplicación)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
EMAIL_FROM_NAME=Nuri Task API

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 4. Configurar MongoDB

**Opción A - Local:**

```bash
mongod --dbpath=/ruta/a/tu/carpeta/datos
```

**Opción B - MongoDB Atlas (Cloud):**
Actualiza `MONGO_URI` en `.env` con tu URI de conexión de Atlas.

### 5. (Opcional) Datos de prueba

El proyecto incluye archivos JSON con datos de ejemplo en la carpeta `resources/moongo-scripts/`:

- `users-data.json` - Usuarios de ejemplo
- `todos-data.json` - Tareas de ejemplo
- `goals-data.json` - Metas de ejemplo
- `metrics-data.json` - Métricas de ejemplo
- `achievements-data.json` - Logros del sistema

Estos archivos pueden ser importados a MongoDB si se desea trabajar con datos de prueba.

### 6. Iniciar el servidor

```bash
npm start
# o en modo desarrollo
npm run dev
```

El backend estará disponible en: **http://localhost:8888**

Documentación Swagger: **http://localhost:8888/api-docs**

---

## 📦 Instalación del Frontend

### 1. Clonar el repositorio

```bash
git clone https://github.com/leo2143/nuri-task-app.git
cd nuri-task-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Coloca el archivo `.env` proporcionado en la raíz del proyecto. Debe contener:

```env
VITE_API_BASE_URL=
VITE_API_TIMEOUT=10000
```

> **Nota:** `VITE_API_BASE_URL` vacío usa el proxy configurado que apunta a `http://localhost:8888`

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

---

## 📱 Nota sobre el Diseño

Este proyecto está **diseñado principalmente para dispositivos móviles**. Para la mejor experiencia, utiliza el modo de vista móvil en las herramientas de desarrollo del navegador.

---

## 🔌 Principales Endpoints de la API

### ✅ Consumidos desde el Frontend

#### Autenticación

```
POST   /api/users/register
POST   /api/users/login
POST   /api/users/forgot-password
GET    /api/users/verify-reset-token/:token
POST   /api/users/reset-password
```

#### Tareas

```
GET    /api/todos
GET    /api/todos/:id
POST   /api/todos
PUT    /api/todos/:id
PATCH  /api/todos/:id/state
DELETE /api/todos/:id
```

#### Metas

```
GET    /api/goals
GET    /api/goals/catalogs
GET    /api/goals/:id
POST   /api/goals
PATCH  /api/goals/:id
PATCH  /api/goals/:id/subgoals
DELETE /api/goals/:id
```

### ⚠️ Disponibles en Backend (No integrados en Frontend)

#### Logros

```
GET    /api/achievements
GET    /api/achievements/user
POST   /api/achievements/unlock
POST   /api/achievements/increment
```

#### Métricas

```
GET    /api/metrics/:goalId
POST   /api/metrics
PUT    /api/metrics/:goalId
```

#### Moodboards

```
GET    /api/moodboards
POST   /api/moodboards
PUT    /api/moodboards/:id
DELETE /api/moodboards/:id
```

#### Comentarios

```
POST   /api/todos/:id/comments
POST   /api/goals/:id/comments
```

**Documentación completa:** http://localhost:8888/api-docs

---

## 🏗️ Estructura de Carpetas

### Backend

```
nuri-task-api/
├── controllers/         # Controladores de rutas
├── services/           # Lógica de negocio
├── models/             # Schemas de Mongoose
├── middlewares/        # Auth y manejo de errores
├── routes/             # Definición de rutas
├── resources/          # Templates y datos de prueba
└── public/             # Swagger UI estático
```

### Frontend

```
nuri-task-app/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── config/         # Configuración (axios, env)
│   ├── context/        # State global (AuthContext)
│   ├── interfaces/     # TypeScript interfaces
│   ├── pages/          # Páginas de la aplicación
│   ├── routes/         # React Router config
│   └── services/       # Servicios API
└── vite.config.ts
```

---

## 🔧 Comandos Útiles

### Backend

```bash
npm start              # Iniciar servidor
npm run dev            # Modo desarrollo (nodemon)
npm run swagger        # Generar documentación Swagger
npm run format         # Formatear código (Prettier)
```

### Frontend

```bash
npm run dev            # Servidor de desarrollo
npm run build          # Build para producción
npm run preview        # Preview del build
npm run lint           # Linting (ESLint)
```

---

## 🌐 Enlaces del Proyecto

### Repositorios en GitHub

- **Frontend:** https://github.com/leo2143/nuri-task-app
- **Backend:** https://github.com/leo2143/nuri-task-api

### Proyecto Desplegado en Vercel

- **Frontend:** https://nuri-task-app.vercel.app/login
- **Backend API:** https://nuri-task-api.vercel.app
- **Documentación API:** https://nuri-task-api.vercel.app/api-docs

---

## 📄 Licencia

ISC License - Copyright (c) 2024

---

<div align="center">

**Desarrollado con 💚 por Leonardo Orellana y Sofía Figueredo**

**[⬆ Volver arriba](#-nuri-task---guía-de-instalación-completa)**

</div>
