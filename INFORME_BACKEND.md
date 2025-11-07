# 🚀 INFORME BACKEND - NURI TASK API

## Sistema de Gestión de Productividad y Tareas

---

## 📌 Resumen Ejecutivo

**Nuri Task API** es una API REST completa desarrollada con Node.js y Express que permite gestionar tareas, metas personales, métricas de progreso y un sistema de gamificación motivacional. Está diseñada para ayudar a los usuarios a organizar su productividad mediante metodologías probadas como SMART goals y seguimiento de hábitos.

**Estado:** ✅ Operativa y desplegada en Vercel  
**Endpoints:** 39+ operaciones disponibles  
**Autenticación:** JWT + Bcrypt

---

## 🎯 Funcionalidades Principales

### 1️⃣ **Gestión de Tareas (Todos)**

- ✅ CRUD completo (Crear, Leer, Actualizar, Eliminar)
- ✅ Prioridades (baja, media, alta)
- ✅ Fechas límite y estados (completado/pendiente)
- ✅ Sistema de comentarios por tarea
- ✅ Filtros avanzados (por prioridad, estado, búsqueda)
- ✅ Vinculación con metas específicas

**Casos de uso:** Gestión diaria de tareas personales o profesionales

### 2️⃣ **Sistema de Metas (Goals)**

- ✅ Creación de metas con metodología SMART
  - **S**pecific (Específica)
  - **M**easurable (Medible)
  - **A**chievable (Alcanzable)
  - **R**elevant (Relevante)
  - **T**ime-bound (Con plazo)
- ✅ Estados: activo, pausado, completado
- ✅ Progreso automático basado en tareas completadas
- ✅ Sistema de comentarios motivacionales
- ✅ Historial de cambios
- ✅ Priorización y fechas límite

**Casos de uso:** Planificación de objetivos a largo plazo, desarrollo personal

### 3️⃣ **Métricas y Seguimiento (Metrics)**

Sistema avanzado de análisis y predicciones:

- ✅ **Progreso actual** (0-100%)
- ✅ **Métricas semanales** con tendencias
- ✅ **Dashboard completo** con estadísticas
- ✅ **Predicciones automáticas** de fecha de completado
- ✅ **Sistema de hitos** (milestones) con seguimiento
- ✅ **Bloqueadores** identificables y resolvibles
- ✅ **Logros semanales** (weekly wins)
- ✅ **Historial detallado** por semana
- ✅ **Sistema de alertas** automáticas
- ✅ **Análisis de eficiencia** y desviaciones
- ✅ **Estado de salud** de la meta (good/at-risk)

**Casos de uso:** Análisis de productividad, identificación de patrones, ajuste de estrategias

### 4️⃣ **Sistema de Logros (Achievements)**

Gamificación para mantener motivación:

- ✅ Logros predefinidos del sistema
- ✅ Logros personalizables por usuario
- ✅ Desbloqueo automático basado en progreso
- ✅ Sistema de puntos e iconos
- ✅ Tracking de progreso hacia logros
- ✅ Historial de logros desbloqueados

**Ejemplos de logros:**

- "Primera tarea completada"
- "Meta alcanzada"
- "Racha de 7 días"

### 5️⃣ **Tableros de Inspiración (Moodboards)**

- ✅ Colección de imágenes motivacionales
- ✅ Frases inspiracionales
- ✅ Vinculación con metas específicas
- ✅ Gestión dinámica de contenido
- ✅ Edición de imágenes y frases

**Casos de uso:** Mantener motivación visual, recordatorios de "por qué"

### 6️⃣ **Gestión de Usuarios**

- ✅ Registro con encriptación de contraseñas (Bcrypt)
- ✅ Login con generación de token JWT
- ✅ Recuperación de contraseña vía email
- ✅ Reset de contraseña con tokens temporales
- ✅ Actualización de perfil
- ✅ Sistema de búsqueda de usuarios

---

## 🏗️ Arquitectura Técnica

### **Stack Tecnológico**

```
Backend Framework:  Express.js v5.1.0
Base de Datos:      MongoDB (Mongoose v8.18.1)
Autenticación:      JWT + Bcrypt
Email:              Nodemailer v7.0.10
Documentación:      Swagger UI + swagger-autogen
Despliegue:         Vercel (serverless)
Code Quality:       Prettier
```

### **Patrón de Diseño: Arquitectura en Capas**

```
┌─────────────────────────┐
│   Routes                │  → Definición de endpoints
├─────────────────────────┤
│   Controllers           │  → Manejo de HTTP (req/res)
├─────────────────────────┤
│   Services              │  → Lógica de negocio
├─────────────────────────┤
│   Models (Mongoose)     │  → Esquemas y validaciones
├─────────────────────────┤
│   DTOs                  │  → Validación de datos de entrada
├─────────────────────────┤
│   MongoDB               │  → Persistencia
└─────────────────────────┘
```

### **Estructura de Directorios**

```
nuri-task-api/
├── controllers/          # 5 módulos organizados
│   ├── todos/
│   ├── goals/
│   ├── metrics/
│   ├── achievements/
│   └── users/
├── services/            # Lógica de negocio separada
├── models/              # Schemas + DTOs organizados
│   ├── dtos/
│   │   ├── todo/
│   │   ├── goals/
│   │   ├── metrics/
│   │   └── ...
├── middlewares/         # Auth + Error handling
├── routes/              # Enrutador principal
├── resources/           # Templates + datos de prueba
└── public/              # Frontend + Swagger estático
```

---

## 🔐 Seguridad y Autenticación

### **Sistema Implementado**

1. **Registro:** Contraseña hasheada con Bcrypt (10 rounds)
2. **Login:** Validación + generación de JWT token
3. **Middleware de Auth:** Verifica token en cada request protegido
4. **Recuperación de contraseña:**
   - Token temporal de 1 hora
   - Envío por email con link de reset
   - Token de un solo uso

### **Headers de Autorización**

```
Authorization: Bearer <token_jwt>
```

### **Rutas Públicas vs Protegidas**

- **Públicas:** `/register`, `/login`, `/forgot-password`, `/health`
- **Protegidas:** Resto de endpoints (requieren token)

---

## 📊 Base de Datos - Modelos

### **Colecciones MongoDB**

| Modelo              | Campos Principales                                           | Relaciones          |
| ------------------- | ------------------------------------------------------------ | ------------------- |
| **User**            | name, email, password, createdAt                             | → Goals, Todos      |
| **Todo**            | title, description, completed, priority, dueDate, comments   | → User, Goal        |
| **Goal**            | title, description, status, smart, metrics, progress         | → User, Todos       |
| **Metric**          | GoalId, currentProgress, weeklyData, predictions, milestones | → Goal              |
| **Achievement**     | title, description, points, criteria, icon                   | -                   |
| **UserAchievement** | userId, achievementId, progress, unlocked                    | → User, Achievement |
| **Moodboard**       | title, images, phrases, GoalId                               | → Goal              |

### **Relaciones Clave**

- User **tiene muchos** Goals y Todos
- Goal **tiene muchos** Todos (tareas relacionadas)
- Goal **tiene una** Metric
- User **desbloquea muchos** Achievements

---

## 🎯 Decisiones de Diseño

### **1. Arquitectura en Capas**

**Por qué:** Separación de responsabilidades, código más mantenible y testeable.

### **2. DTOs (Data Transfer Objects)**

**Por qué:** Validación centralizada de datos de entrada, prevención de datos corruptos.

### **3. Services separados de Controllers**

**Por qué:** Lógica de negocio reutilizable, controllers más limpios.

### **4. Sistema de Métricas Complejo**

**Por qué:** Ofrecer insights reales de productividad, no solo "tareas completadas".

### **5. Gamificación (Achievements)**

**Por qué:** Mantener motivación del usuario, aumentar engagement.

### **6. Metodología SMART en Goals**

**Por qué:** Forzar metas bien definidas, aumentar probabilidad de éxito.

### **7. MongoDB sobre SQL**

**Por qué:**

- Flexibilidad en schemas (métricas pueden evolucionar)
- Mejor performance con datos anidados (comentarios, smart goals)
- Escalabilidad horizontal

### **8. JWT sobre Sessions**

**Por qué:** Stateless API, mejor para arquitectura serverless (Vercel).

### **9. Swagger estático en Vercel**

**Por qué:** `swagger-ui-express` no funciona en serverless, solución: servir archivos estáticos.

---

## 📧 Sistema de Emails

### **Funcionalidades**

- ✅ Recuperación de contraseña
- ✅ Confirmación de cambios
- ✅ Templates HTML responsive
- ✅ Variables dinámicas (nombre, URL, token)
- ✅ Branding personalizado

### **Configuración**

- **Proveedor:** Gmail (SMTP)
- **Puerto:** 587 (TLS)
- **Seguridad:** Contraseña de aplicación de Google

---

## 📈 Estadísticas del Proyecto

| Categoría              | Cantidad          |
| ---------------------- | ----------------- |
| **Endpoints totales**  | 39+               |
| **Modelos de datos**   | 7 principales     |
| **DTOs de validación** | 20+               |
| **Services**           | 8 archivos        |
| **Controllers**        | 6 módulos         |
| **Middlewares**        | 2 (auth + errors) |
| **Templates de email** | 2 HTML            |
| **Líneas de código**   | ~5,000+           |

---

## 🚀 Características Avanzadas

### **1. Predicciones Automáticas**

El sistema calcula:

- Fecha estimada de completado de meta
- Desviación del progreso esperado
- Tendencia (mejorando/estancado/retrocediendo)

### **2. Sistema de Alertas Inteligentes**

Alertas automáticas cuando:

- Meta atrasada >10%
- Sin progreso en 2 semanas
- Bloqueadores sin resolver
- Hito próximo a vencerse

### **3. Cálculo de Eficiencia**

```
Eficiencia = Progreso Real / Progreso Esperado
```

- > 1.0: Por encima del plan
- 1.0: En tiempo
- <1.0: Atrasado

### **4. Health Status Automático**

- **Good:** Progreso según lo planeado
- **At Risk:** Desviación >15% o bloqueadores críticos

### **5. Progreso Automático de Goals**

Calculado en tiempo real basado en:

```
Progreso = (Tareas Completadas / Total Tareas) × 100
```

---

## 🔧 Endpoints Clave

### **Tareas**

```
GET    /api/todos              # Listar con filtros
POST   /api/todos              # Crear
PUT    /api/todos/:id          # Actualizar
DELETE /api/todos/:id          # Eliminar
GET    /api/todos/completed    # Solo completadas
GET    /api/todos/pending      # Solo pendientes
POST   /api/todos/:id/comments # Agregar comentario
```

### **Metas**

```
POST   /api/goals              # Crear con SMART
GET    /api/goals/active       # Metas activas
POST   /api/goals/:id/comments # Comentar
POST   /api/goals/:id/metrics  # Agregar métrica semanal
```

### **Métricas**

```
GET    /api/metrics/:id/dashboard        # Dashboard completo
POST   /api/metrics/:id/predictions      # Actualizar predicciones
POST   /api/metrics/:id/milestones       # Agregar hito
POST   /api/metrics/:id/blockers         # Reportar bloqueador
PUT    /api/metrics/:id/blockers/:bid/resolve
POST   /api/metrics/:id/history          # Agregar entrada histórica
```

### **Logros**

```
GET    /api/achievements/user            # Logros del usuario
POST   /api/achievements/unlock          # Desbloquear logro
POST   /api/achievements/increment       # Incrementar progreso
```

---

## 🌐 Despliegue y Producción

### **Plataforma: Vercel**

- ✅ Serverless deployment
- ✅ Auto-scaling
- ✅ HTTPS automático
- ✅ Edge network global
- ✅ Variables de entorno seguras

### **Base de Datos: MongoDB Atlas**

- ✅ Cloud-hosted
- ✅ Backups automáticos
- ✅ Replicación
- ✅ Free tier disponible

### **CI/CD**

- Auto-deploy en push a main
- Generación de Swagger en build

---

## 📚 Documentación

### **Swagger UI**

- ✅ Documentación interactiva completa
- ✅ Prueba de endpoints desde el navegador
- ✅ Schemas de request/response
- ✅ Ejemplos de código

**Acceso:** `https://tu-dominio.vercel.app/api-docs`

### **Frontend de Documentación**

- ✅ Landing page profesional
- ✅ Catálogo visual de endpoints
- ✅ Ejemplos de uso
- ✅ Navegación por categorías

---

## ✅ Ventajas del Sistema

1. **Completo:** Cubre todo el ciclo de productividad (tareas → metas → métricas → motivación)
2. **Inteligente:** Predicciones y alertas automáticas
3. **Motivacional:** Gamificación y moodboards
4. **Escalable:** Arquitectura modular y serverless
5. **Seguro:** JWT + Bcrypt + validaciones
6. **Documentado:** Swagger + frontend interactivo
7. **Moderno:** Stack actualizado (Express v5, ES6 modules)
8. **Metodológico:** Implementa SMART goals correctamente

---

## 🎯 Casos de Uso Reales

### **Estudiante Universitario**

- Gestiona tareas de múltiples materias
- Crea meta "Graduarme con promedio >8"
- Trackea progreso semanal
- Recibe alertas de fechas límite

### **Freelancer/Profesional**

- Organiza proyectos como metas
- Divide proyectos en tareas
- Analiza eficiencia con métricas
- Celebra logros desbloqueados

### **Desarrollo Personal**

- Meta: "Aprender programación"
- Tareas: Completar cursos, ejercicios
- Métricas: Horas invertidas, progreso
- Moodboard: Screenshots de proyectos terminados

---

## 🔮 Próximas Mejoras Potenciales

1. **Colaboración:** Compartir metas con equipos
2. **Notificaciones Push:** Alertas en tiempo real
3. **IA Predictiva:** ML para mejores predicciones
4. **Integración Calendario:** Sincronización con Google Calendar
5. **Estadísticas Globales:** Comparativas anónimas
6. **Export de Datos:** PDF/Excel de métricas

---

## 👥 Información del Proyecto

**Desarrolladores:** Leonardo Orellana, Sofía Figueredo  
**Fecha:** Noviembre 2024  
**Versión:** 1.0.0  
**Licencia:** ISC

**Stack:** Node.js + Express + MongoDB + JWT  
**Despliegue:** Vercel + MongoDB Atlas  
**Estado:** ✅ Producción

---

## 📊 Resumen Técnico en Números

```
39+ Endpoints REST
7 Modelos de Datos
20+ DTOs de Validación
8 Services
6 Controladores
~5,000 líneas de código
100% Documentado (Swagger)
JWT + Bcrypt Security
Serverless en Vercel
MongoDB Atlas Cloud
```

---

<div align="center">

## 🎯 Conclusión

**Nuri Task API es un sistema backend robusto, completo y moderno para gestión de productividad.**

Combina funcionalidades básicas (CRUD de tareas) con características avanzadas (predicciones, gamificación, metodología SMART) en una arquitectura escalable y bien documentada.

**Listo para producción. Listo para escalar. Listo para motivar.**

</div>
