# 🎯 Nuri Task API

![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)
![Express](https://img.shields.io/badge/Express-v5.1.0-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-v8.18.1-green.svg)
![License](https://img.shields.io/badge/License-ISC-yellow.svg)

**API RESTful moderna y completa para gestión de tareas, metas y productividad con sistema motivacional integrado.**

Nuri Task API es una solución backend robusta diseñada para ayudar a los usuarios a gestionar sus tareas diarias, establecer metas a largo plazo, y mantener la motivación a través de logros, métricas de progreso y tableros de inspiración personalizados.

---

## 📋 Tabla de Contenidos

- [✨ Características](#-características)
- [🏗️ Arquitectura](#️-arquitectura)
- [🚀 Inicio Rápido](#-inicio-rápido)
- [⚙️ Configuración](#️-configuración)
- [📚 Documentación](#-documentación)
- [🔐 Autenticación](#-autenticación)
- [🛠️ Scripts](#️-scripts)
- [🌐 Despliegue](#-despliegue)
- [📧 Sistema de Correos](#-sistema-de-correos)
- [📊 Datos de Prueba](#-datos-de-prueba)
- [📄 Licencia](#-licencia)

---

## ✨ Características

**🎯 Gestión de Tareas**

- CRUD completo con prioridades y estados
- Sistema de comentarios y filtros avanzados
- Vinculación con metas

**🎓 Sistema de Metas**

- Progreso automático basado en tareas
- Estados personalizables y comentarios
- Historial de progreso

**🏆 Logros y Gamificación**

- Logros predefinidos y personalizables
- Desbloqueo automático por progreso
- Sistema de tracking completo

**📊 Métricas Motivacionales**

- Progreso actual (0-100%)
- Sistema de rachas (streaks)
- Enfoque motivacional positivo

**🎨 Moodboards**

- Imágenes y frases inspiracionales
- Vinculación con metas
- Gestión dinámica de contenido

**🔐 Seguridad**

- Autenticación JWT + Bcrypt
- Recuperación de contraseña por email
- Middleware de protección de rutas
- Tokens con expiración

**📧 Sistema de Emails**

- Templates HTML responsive
- Branding personalizado
- Variables dinámicas

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
Backend:        Express.js v5.1.0
Base de Datos:  MongoDB (Mongoose v8.18.1)
Autenticación:  JWT + Bcrypt
Email:          Nodemailer v7.0.10
Documentación:  Swagger UI + JSDoc
Code Style:     Prettier
```

### Estructura del Proyecto

```
nuri-task-api/
├── controllers/         # Controladores de rutas por módulo
├── services/           # Lógica de negocio
├── models/             # Schemas de Mongoose + DTOs
├── middlewares/        # Auth y manejo de errores
├── routes/             # Definición de rutas
├── resources/          # Templates de email y datos de prueba
├── public/             # Assets estáticos
└── swagger_output.json # Documentación API
```

### Patrón de Diseño - Arquitectura en Capas

```
┌──────────────────────┐
│   Controllers        │  ← HTTP Requests/Responses
├──────────────────────┤
│   Services           │  ← Lógica de negocio
├──────────────────────┤
│   Models             │  ← Validación y esquemas
├──────────────────────┤
│   MongoDB            │  ← Persistencia
└──────────────────────┘
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js v20+
- npm v10+
- MongoDB v6.0+ (local o cloud)

### Instalación

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd nuri-task-api

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores

# 4. Iniciar servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/nuri-task-db

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# Servidor
PORT=3000
NODE_ENV=development

# Email (Gmail)
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

### Configuración de Email (Gmail)

1. Activa **verificación en dos pasos** en Google
2. Genera **contraseña de aplicación**: https://myaccount.google.com/security
3. Usa esa contraseña en `EMAIL_PASSWORD`

### MongoDB

**Opción 1 - Local:**

```bash
mongod --dbpath=/ruta/a/tu/carpeta/datos
```

**Opción 2 - Cloud (MongoDB Atlas):**

1. Crea cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea cluster gratuito
3. Obtén URI de conexión
4. Actualiza `MONGO_URI` en `.env`

---

## 📚 Documentación

### Swagger UI

Documentación interactiva disponible en:

```
http://localhost:3000/api-docs
```

#### ⚠️ Solución de Problemas con Swagger en Vercel

Durante el despliegue en Vercel, `swagger-ui-express` presentaba problemas en entornos serverless (error: `SwaggerUIBundle is not defined`). La solución implementada fue servir Swagger UI como archivos estáticos locales en lugar de depender del paquete:

1. **Archivos descargados**: CSS, JS y assets de Swagger UI se descargan durante el build (`npm run prebuild`)
2. **Servidos estáticamente**: Los archivos se sirven desde `public/swagger-ui/`
3. **JSON dinámico**: El `swagger.json` se genera y sirve dinámicamente desde Express

Esta solución está basada en el enfoque documentado por [Vishal Kumar Singh](https://www.linkedin.com/pulse/solving-swaggeruibundle-defined-error-express-swagger-kumar-singh-p71xc/) y garantiza compatibilidad con funciones Lambda de Vercel.

### Endpoints Principales

#### 🔐 Autenticación

```
POST   /api/users/register          # Registrar usuario
POST   /api/users/login             # Iniciar sesión
POST   /api/users/forgot-password   # Solicitar recuperación
POST   /api/users/reset-password    # Resetear contraseña
```

#### 📝 Tareas

```
GET    /api/todos                   # Listar tareas
GET    /api/todos/:id               # Obtener tarea
POST   /api/todos                   # Crear tarea
PUT    /api/todos/:id               # Actualizar tarea
DELETE /api/todos/:id               # Eliminar tarea
POST   /api/todos/:id/comments      # Agregar comentario
```

#### 🎯 Metas

```
GET    /api/goals                   # Listar metas
POST   /api/goals                   # Crear meta
PUT    /api/goals/:id               # Actualizar meta
DELETE /api/goals/:id               # Eliminar meta
POST   /api/goals/:id/comments      # Agregar comentario
```

#### 🏆 Logros

```
GET    /api/achievements            # Logros del sistema
GET    /api/achievements/user       # Logros del usuario
POST   /api/achievements/unlock     # Desbloquear logro
POST   /api/achievements/increment  # Incrementar progreso
```

#### 📊 Métricas

```
GET    /api/metrics/:goalId         # Métricas de meta
POST   /api/metrics                 # Crear métricas
PUT    /api/metrics/:goalId         # Actualizar métricas
```

#### 🎨 Moodboards

```
GET    /api/moodboards              # Listar moodboards
POST   /api/moodboards              # Crear moodboard
PUT    /api/moodboards/:id          # Actualizar
DELETE /api/moodboards/:id          # Eliminar
```

---

## 🔐 Autenticación

### Sistema JWT

**Flujo:**

1. Usuario envía credenciales a `/api/users/login`
2. API valida y genera JWT token
3. Cliente incluye token en header `Authorization: Bearer <token>`

### Recuperación de Contraseña

1. Usuario solicita: `POST /api/users/forgot-password`
2. Sistema envía email con token
3. Usuario resetea: `POST /api/users/reset-password`

---

## 🛠️ Scripts

```bash
# Desarrollo
npm start              # Iniciar servidor
npm run dev            # Modo desarrollo (con nodemon)

# Documentación
npm run swagger        # Generar Swagger

# Code Quality
npm run format         # Formatear con Prettier
npm run format:check   # Verificar formato
```

---

## 🌐 Despliegue

### Vercel (Recomendado)

```bash
# 1. Instalar CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Desplegar
vercel

# 4. Configurar variables de entorno
vercel env add MONGO_URI
vercel env add JWT_SECRET
vercel env add EMAIL_USER
vercel env add EMAIL_PASSWORD
```

---

## 📧 Sistema de Correos

### Templates Incluidos

- `resources/mail-template.html` - Recuperación de contraseña
- `resources/mail-template-confirmation.html` - Confirmación de cambios

### Variables Dinámicas

```html
${userName}
<!-- Nombre del usuario -->
${resetUrl}
<!-- URL de reseteo -->
${resetToken}
<!-- Token de recuperación -->
```

**Características:**

- ✅ Diseño responsive
- ✅ Branding Nuri Task
- ✅ HTML5 semántico
- ✅ Protección Prettier

---

## 📊 Datos de Prueba

Archivos de ejemplo en `resources/moongo-scripts/`:

```bash
# Importar con mongoimport
mongoimport --db nuri-task-db --collection users \
  --file resources/moongo-scripts/users-data.json --jsonArray

mongoimport --db nuri-task-db --collection todos \
  --file resources/moongo-scripts/todos-data.json --jsonArray

mongoimport --db nuri-task-db --collection goals \
  --file resources/moongo-scripts/goals-data.json --jsonArray

mongoimport --db nuri-task-db --collection metrics \
  --file resources/moongo-scripts/metrics-data.json --jsonArray

mongoimport --db nuri-task-db --collection achievements \
  --file resources/moongo-scripts/achievements-data.json --jsonArray
```

---

## 📄 Licencia

ISC License - Copyright (c) 2024 Leonardo Orellana

---

## 👨‍💻 Autor

**Leonardo Orellana**

---

## 🙏 Agradecimientos

- [Express.js](https://expressjs.com/) - Framework web
- [MongoDB](https://www.mongodb.com/) - Base de datos
- [Mongoose](https://mongoosejs.com/) - ODM
- [JWT](https://jwt.io/) - Autenticación
- [Nodemailer](https://nodemailer.com/) - Email service
- [Swagger](https://swagger.io/) - Documentación API

---

<div align="center">

**[⬆ Volver arriba](#-nuri-task-api)**

Hecho por Leonardo Orellana y Figueredo Sofia

</div>
