# 🎯 Nuri Task API

![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)
![Express](https://img.shields.io/badge/Express-v5.1.0-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-v8.18.1-green.svg)
![License](https://img.shields.io/badge/License-ISC-yellow.svg)

**API RESTful moderna y completa para gestión de tareas, metas y productividad con sistema motivacional integrado.**

Nuri Task API es una solución backend robusta diseñada para ayudar a los usuarios a gestionar sus tareas diarias, establecer metas a largo plazo, y mantener la motivación a través de logros, métricas de progreso y tableros de inspiración personalizados.

---

## 💚 La Visión

**Nuri Task** no es una app más de listas. Es una aplicación creada para ayudarte a construir hábitos y cumplir tus metas de una forma **emocionalmente acompañada, sin presión y sin culpas**.

### ¿Qué hace diferente a Nuri?

Descubrimos que el verdadero problema no es la falta de disciplina, sino la **falta de motivación emocional**. Por eso **Nuri** —tu pequeño compañero— está diseñado para guiarte con calidez en cada paso.

**El propósito de Nuri es:**

🌱 **Acompañarte, no exigirte**

La idea no es que hagas más cosas, sino que te sientas mejor haciéndolas.

🎯 **Ayudarte a crear hábitos sostenibles**

Crear metas, dividirlas en pequeñas tareas manejables, marcar tus avances y recibir apoyo emocional.

💚 **Hacer el proceso amable y disfrutable**

Un espacio donde no te sientes solo, donde no se te juzga por fallar, y donde cada acción tiene un sentido.

✨ **Darte una experiencia más humana**

Celebramos tus progresos y te acompañamos en el camino, con mensajes cálidos y motivadores.

### 📖 Estado Actual del Proyecto

> **Nota:** Este proyecto está en **etapa inicial de desarrollo**. La visión completa de Nuri (con acompañamiento emocional, mensajes motivadores y experiencia personalizada) aún no está completamente implementada. Actualmente cuenta con las funcionalidades base técnicas.

---

## 📋 Tabla de Contenidos

- [💚 La Visión](#-la-visión)
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
- [🔮 Mejoras Futuras](#-mejoras-futuras)
- [📄 Licencia](#-licencia)
- [🌐 Enlaces del Proyecto](#-enlaces-del-proyecto)

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

> ⚠️ **Importante:** Para usar el servicio de recuperación de contraseña ("Me olvidé la contraseña"), se requiere una cuenta de Gmail con inicio de sesión de aplicación configurado. Es fundamental utilizar los datos especificados en el archivo `.env` con las credenciales correctas de Gmail.

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

1. **Archivos estáticos versionados**: CSS, JS y assets de Swagger UI se obtuvieron del paquete oficial [swagger-ui-dist](https://www.npmjs.com/package/swagger-ui-dist) y se versionan en Git
2. **Servidos desde `public/`**: Los archivos se sirven estáticamente desde `public/swagger-ui/`
3. **JSON dinámico**: El `swagger.json` se genera y sirve dinámicamente desde Express
4. **Template personalizado**: Se utiliza el `index.html` oficial de [swagger-ui-dist](https://github.com/swagger-api/swagger-ui/blob/master/dist/index.html) adaptado para apuntar a nuestro endpoint `/api-docs/swagger.json`

Esta solución está basada en el enfoque documentado (https://www.linkedin.com/pulse/solving-swaggeruibundle-defined-error-express-swagger-kumar-singh-p71xc/) y garantiza compatibilidad con Vercel.

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
GET    /api/todos                   # Listar tareas (con filtros)
GET    /api/todos/:id               # Obtener tarea
POST   /api/todos                   # Crear tarea
PUT    /api/todos/:id               # Actualizar tarea
DELETE /api/todos/:id               # Eliminar tarea
POST   /api/todos/:id/comments      # Agregar comentario
```

**Filtros disponibles en `GET /api/todos`:**

| Query Param | Tipo | Descripcion |
|---|---|---|
| `search` | string | Busqueda por titulo (regex case-insensitive) |
| `completed` | boolean | Filtrar por estado completado/pendiente |
| `priority` | `low` \| `medium` \| `high` | Filtrar por prioridad |
| `dueDateFrom` | date (ISO) | Fecha de vencimiento minima |
| `dueDateTo` | date (ISO) | Fecha de vencimiento maxima |
| `sortOrder` | `asc` \| `desc` | Orden de resultados |
| `limit` | number | Cantidad por pagina (max 100, default 10) |
| `cursor` | string | ID del ultimo elemento para paginacion cursor-based |

#### 🎯 Metas

```
GET    /api/goals                   # Listar metas (con filtros)
POST   /api/goals                   # Crear meta
PUT    /api/goals/:id               # Actualizar meta
DELETE /api/goals/:id               # Eliminar meta
POST   /api/goals/:id/comments      # Agregar comentario
```

**Filtros disponibles en `GET /api/goals`:**

| Query Param | Tipo | Descripcion |
|---|---|---|
| `search` | string | Busqueda por titulo y descripcion (regex case-insensitive) |
| `status` | `active` \| `paused` \| `completed` | Filtrar por estado |
| `priority` | `low` \| `medium` \| `high` | Filtrar por prioridad |
| `dueDateFrom` | date (ISO) | Fecha de vencimiento minima |
| `dueDateTo` | date (ISO) | Fecha de vencimiento maxima |
| `parentGoalId` | string | Filtrar submetas de una meta padre |
| `sortOrder` | `asc` \| `desc` | Orden de resultados |
| `limit` | number | Cantidad por pagina (max 100, default 10) |
| `cursor` | string | ID del ultimo elemento para paginacion cursor-based |

#### 🏆 Logros

```
GET    /api/achievements            # Logros del sistema (con filtros)
GET    /api/achievements/user       # Logros del usuario
POST   /api/achievements/unlock     # Desbloquear logro
POST   /api/achievements/increment  # Incrementar progreso
```

**Filtros disponibles en `GET /api/achievements`:**

| Query Param | Tipo | Descripcion |
|---|---|---|
| `search` | string | Busqueda por titulo y descripcion |
| `type` | `task` \| `goal` \| `metric` \| `streak` | Filtrar por tipo de logro |
| `isActive` | boolean | Filtrar por estado activo/inactivo |
| `sortOrder` | `asc` \| `desc` | Orden de resultados |
| `limit` | number | Cantidad por pagina |
| `cursor` | string | Paginacion cursor-based |

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

## 🔮 Mejoras Futuras

### Funcionalidades Implementadas

- ~~**Paginado**: Implementación de paginado para las búsquedas en general (todos, goals, achievements, etc.)~~ - Implementado con paginación cursor-based
- ~~**Filtros avanzados**: Filtros por query params en endpoints de listado~~ - Implementado con DTOs de filtrado para todos, goals, achievements y users

### Funcionalidades Pendientes

---

## 📄 Licencia

ISC License - Copyright (c) 2024 Leonardo Orellana

## 📚 Referencias y Documentación

Este proyecto se desarrolló basándose en documentación oficial y recursos de la comunidad:

### **Tecnologías Core**

- [Express.js](https://expressjs.com/) - Framework web para Node.js
- [MongoDB](https://www.mongodb.com/) - Base de datos NoSQL
- [Mongoose](https://mongoosejs.com/) - ODM para MongoDB
- [JWT](https://jwt.io/) - Autenticación basada en tokens
- [Nodemailer](https://nodemailer.com/) - Servicio de envío de emails

### **Documentación API**

- [Swagger UI](https://swagger.io/) - Framework de documentación OpenAPI
- [swagger-ui-dist](https://github.com/swagger-api/swagger-ui/tree/master/dist) - Distribución de archivos estáticos de Swagger UI
- [swagger-autogen](https://github.com/davibaltar/swagger-autogen) - Generación automática de documentación Swagger

### **Despliegue en Vercel**

- [Vercel Documentation](https://vercel.com/docs) - Documentación oficial de Vercel
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables/system-environment-variables) - Variables de entorno del sistema
- [Vercel Build Step](https://vercel.com/docs/build-step) - Proceso de build en Vercel

### **Solución de Problemas**

- [Solving SwaggerUIBundle Error in Express](https://www.linkedin.com/pulse/solving-swaggeruibundle-defined-error-express-swagger-kumar-singh-p71xc/) - Artículo de Vishal Kumar Singh sobre cómo servir Swagger UI en entornos serverless

### **Mejores Prácticas**

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html) - Seguridad en Express
- [MongoDB Schema Design](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/) - Diseño de esquemas en MongoDB
- [Mongoose Middleware (Query Middleware)](https://mongoosejs.com/docs/middleware.html#types-of-middleware) - Pre-hooks de query utilizados para implementar borrado lógico (soft delete) con filtrado automático de registros eliminados

---

## 🌐 Enlaces del Proyecto

### Proyecto Desplegado en Vercel

- **Frontend:** https://nuri-task-app.vercel.app/login
- **Backend API:** https://nuri-task-api.vercel.app
- **Documentación API:** https://nuri-task-api.vercel.app/api-docs

### Repositorios en GitHub

- **Frontend:** https://github.com/leo2143/nuri-task-app
- **Backend:** https://github.com/leo2143/nuri-task-api

---

<div align="center">

**[⬆ Volver arriba](#-nuri-task-api)**

Hecho por Leonardo Orellana y Figueredo Sofia

</div>
