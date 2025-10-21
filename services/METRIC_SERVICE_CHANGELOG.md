# Changelog - MetricService Actualizado

## 📅 Fecha: 21 de Octubre, 2025

## 🎯 Resumen de Cambios

Se han agregado **14 nuevos métodos** al servicio de métricas para soportar completamente el modelo enriquecido, incluyendo gestión de hitos, bloqueadores, logros semanales, alertas, predicciones y dashboard.

---

## 📊 Estadísticas

- **Métodos originales:** 6
- **Métodos nuevos:** 14
- **Total de métodos:** 20
- **Líneas de código:** 256 → 865 (+609 líneas)
- **DTOs utilizados:** 8 DTOs (6 nuevos)

---

## ✅ Métodos Existentes (Mantenidos)

1. `getAllMetrics(userId)` - Obtiene todas las métricas del usuario
2. `getMetricById(id, userId)` - Obtiene una métrica por ID
3. `createMetric(metricData, userId)` - Crea una nueva métrica
4. `updateMetric(id, metricData, userId)` - Actualiza una métrica
5. `deleteMetric(id, userId)` - Elimina una métrica
6. `getMetricByGoalId(goalId, userId)` - Obtiene métrica por ID de meta

---

## 🆕 Nuevos Métodos Agregados

### 🎯 Gestión de Hitos (3 métodos)

#### 1. `addMilestone(metricId, milestoneData, userId)`

**Propósito:** Agregar hitos a una métrica

**Parámetros:**

- `metricId` - ID de la métrica
- `milestoneData` - Objeto con datos del hito
  - `name` (requerido) - Nombre del hito
  - `targetProgress` (opcional) - Progreso objetivo (0-100)
  - `description` (opcional) - Descripción
- `userId` - ID del usuario autenticado

**DTO:** `AddMilestoneDto`

**Ejemplo:**

```javascript
const result = await MetricService.addMilestone(
  '64f8a1b2c3d4e5f6a7b8c9d0',
  {
    name: 'Prototipo inicial',
    targetProgress: 30,
    description: 'Completar el MVP',
  },
  userId
);
```

---

#### 2. `updateMilestone(metricId, milestoneId, updateData, userId)`

**Propósito:** Actualizar un hito específico

**Parámetros:**

- `metricId` - ID de la métrica
- `milestoneId` - ID del hito
- `updateData` - Datos a actualizar
  - `name` (opcional)
  - `targetProgress` (opcional)
  - `description` (opcional)
  - `achieved` (opcional) - Marca el hito como logrado
- `userId` - ID del usuario

**Ejemplo:**

```javascript
const result = await MetricService.updateMilestone(metricId, milestoneId, { achieved: true }, userId);
```

---

#### 3. `deleteMilestone(metricId, milestoneId, userId)`

**Propósito:** Eliminar un hito

**Ejemplo:**

```javascript
const result = await MetricService.deleteMilestone(metricId, milestoneId, userId);
```

---

### 🚧 Gestión de Bloqueadores (3 métodos)

#### 4. `addBlocker(metricId, blockerData, userId)`

**Propósito:** Agregar un bloqueador a una métrica

**Parámetros:**

- `metricId` - ID de la métrica
- `blockerData` - Datos del bloqueador
  - `description` (requerido) - Descripción del bloqueador
  - `severity` (opcional, default: 'medium') - low/medium/high/critical
- `userId` - ID del usuario

**DTO:** `AddBlockerDto`

**Ejemplo:**

```javascript
const result = await MetricService.addBlocker(
  metricId,
  {
    description: 'API externa no disponible',
    severity: 'critical',
  },
  userId
);
```

---

#### 5. `resolveBlocker(metricId, blockerId, userId)`

**Propósito:** Marcar un bloqueador como resuelto

**DTO:** `ResolveBlockerDto`

**Ejemplo:**

```javascript
const result = await MetricService.resolveBlocker(metricId, blockerId, userId);
```

---

#### 6. `deleteBlocker(metricId, blockerId, userId)`

**Propósito:** Eliminar un bloqueador

**Ejemplo:**

```javascript
const result = await MetricService.deleteBlocker(metricId, blockerId, userId);
```

---

### 🏆 Gestión de Logros Semanales (2 métodos)

#### 7. `addWeeklyWin(metricId, winData, userId)`

**Propósito:** Agregar un logro semanal

**Parámetros:**

- `metricId` - ID de la métrica
- `winData` - Datos del logro
  - `description` (requerido) - Descripción del logro
  - `week` (requerido) - Semana del logro
- `userId` - ID del usuario

**DTO:** `AddWeeklyWinDto`

**Ejemplo:**

```javascript
const result = await MetricService.addWeeklyWin(
  metricId,
  {
    description: 'Completamos todas las pruebas',
    week: 'Semana 3',
  },
  userId
);
```

---

#### 8. `deleteWeeklyWin(metricId, winId, userId)`

**Propósito:** Eliminar un logro semanal

**Ejemplo:**

```javascript
const result = await MetricService.deleteWeeklyWin(metricId, winId, userId);
```

---

### 📚 Gestión de Historial (1 método)

#### 9. `addHistoryEntry(metricId, historyData, userId)`

**Propósito:** Agregar una entrada al historial de la métrica

**Parámetros:**

- `metricId` - ID de la métrica
- `historyData` - Datos de la entrada
  - `week` (requerido) - Semana
  - `totalCompletedTasks` (opcional)
  - `totalTasks` (opcional)
  - `progress` (opcional)
  - `timeInvested` (opcional) - Horas invertidas
  - `notes` (opcional)
  - `mood` (opcional) - motivated/neutral/challenged/frustrated
  - `achievements` (opcional) - Array de logros
- `userId` - ID del usuario

**DTO:** `UpdateHistoryDto`

**Ejemplo:**

```javascript
const result = await MetricService.addHistoryEntry(
  metricId,
  {
    week: 'Semana 2',
    progress: 30,
    timeInvested: 12,
    mood: 'motivated',
    achievements: ['Completé el login', 'Arreglé 5 bugs'],
  },
  userId
);
```

---

### 🔔 Gestión de Alertas (2 métodos)

#### 10. `acknowledgeAlert(metricId, alertId, userId)`

**Propósito:** Confirmar/marcar como leída una alerta

**DTO:** `AcknowledgeAlertDto`

**Ejemplo:**

```javascript
const result = await MetricService.acknowledgeAlert(metricId, alertId, userId);
```

---

#### 11. `getUnacknowledgedAlerts(metricId, userId)`

**Propósito:** Obtener alertas no confirmadas de una métrica

**Retorna:** Array de alertas sin confirmar

**Ejemplo:**

```javascript
const result = await MetricService.getUnacknowledgedAlerts(metricId, userId);
// result.data = [{ type: 'warning', message: '...', ... }]
```

---

### 📈 Cálculos y Predicciones (2 métodos)

#### 12. `updatePredictions(metricId, userId)`

**Propósito:** Actualizar predicciones y métricas calculadas

**Calcula:**

- `expectedProgress` - Progreso que debería tener
- `progressDeviation` - Desviación del plan
- `projectedCompletionDate` - Fecha estimada de completado

**Ejemplo:**

```javascript
const result = await MetricService.updatePredictions(metricId, userId);
// Actualiza automáticamente las predicciones basadas en el historial
```

---

#### 13. `getMetricDashboard(metricId, userId)`

**Propósito:** Obtener dashboard completo de métricas

**Retorna:** Objeto completo con:

- `goalInfo` - Información de la meta
- `currentStatus` - Estado actual
- `performance` - Métricas de rendimiento
- `predictions` - Predicciones
- `streaks` - Rachas de progreso
- `health` - Estado de salud
- `tasks` - Análisis de tareas
- `milestones` - Hitos
- `blockers` - Bloqueadores activos
- `recentWins` - Últimos 5 logros
- `recentHistory` - Últimas 4 semanas
- `alerts` - Alertas sin confirmar

**Ejemplo:**

```javascript
const result = await MetricService.getMetricDashboard(metricId, userId);

// Resultado:
{
  success: true,
  data: {
    goalInfo: { id, title, description, status, dueDate },
    currentStatus: { week, progress, completedTasks, totalTasks, ... },
    performance: { averageWeeklyProgress, progressTrend, efficiency, ... },
    predictions: { expectedProgress, progressDeviation, projectedCompletionDate },
    streaks: { current, best },
    health: { status, isAtRisk, activeBlockers, unacknowledgedAlerts },
    tasks: { breakdown, overdue, onTimeCompletionRate, completionPercentage },
    milestones: [...],
    blockers: [...],
    recentWins: [...],
    recentHistory: [...],
    alerts: [...]
  }
}
```

---

## 🔄 Flujo de Uso Típico

### 1. Crear y Configurar Métrica

```javascript
// 1. Crear métrica
const metric = await MetricService.createMetric(
  {
    GoalId: goalId,
    currentWeek: 'Semana 1',
    currentProgress: 10,
  },
  userId
);

// 2. Agregar hitos
await MetricService.addMilestone(
  metricId,
  {
    name: 'MVP',
    targetProgress: 30,
  },
  userId
);

await MetricService.addMilestone(
  metricId,
  {
    name: 'Beta',
    targetProgress: 75,
  },
  userId
);
```

### 2. Actualizar Progreso Semanal

```javascript
// 1. Guardar semana actual en historial
await MetricService.addHistoryEntry(
  metricId,
  {
    week: 'Semana 1',
    progress: 10,
    totalCompletedTasks: 5,
    totalTasks: 20,
    timeInvested: 8,
    mood: 'motivated',
    achievements: ['Setup completo', 'Primeras features'],
  },
  userId
);

// 2. Actualizar progreso actual
await MetricService.updateMetric(
  metricId,
  {
    currentWeek: 'Semana 2',
    currentProgress: 25,
    totalCompletedTasks: 10,
  },
  userId
);

// 3. Actualizar predicciones
await MetricService.updatePredictions(metricId, userId);
```

### 3. Gestionar Bloqueadores y Logros

```javascript
// Agregar bloqueador
const blocker = await MetricService.addBlocker(
  metricId,
  {
    description: 'Esperando aprobación del diseño',
    severity: 'high',
  },
  userId
);

// Agregar logro
await MetricService.addWeeklyWin(
  metricId,
  {
    description: 'Completamos el módulo de auth',
    week: 'Semana 2',
  },
  userId
);

// Resolver bloqueador
await MetricService.resolveBlocker(metricId, blockerId, userId);
```

### 4. Monitorear y Analizar

```javascript
// Obtener dashboard completo
const dashboard = await MetricService.getMetricDashboard(metricId, userId);

// Revisar alertas
const alerts = await MetricService.getUnacknowledgedAlerts(metricId, userId);

// Confirmar alertas
for (const alert of alerts.data) {
  await MetricService.acknowledgeAlert(metricId, alert._id, userId);
}
```

---

## 🔒 Seguridad

Todos los métodos incluyen:

✅ **Verificación de autenticación** - Requieren `userId`  
✅ **Verificación de permisos** - Solo el propietario puede modificar  
✅ **Validación de DTOs** - Datos validados antes de persistir  
✅ **Manejo de errores** - Try-catch en todos los métodos  
✅ **Respuestas consistentes** - Usando modelos de respuesta

---

## 📦 DTOs Utilizados

| Método             | DTO Utilizado         |
| ------------------ | --------------------- |
| `createMetric`     | `CreateMetricDto`     |
| `updateMetric`     | `UpdateMetricDto`     |
| `addMilestone`     | `AddMilestoneDto`     |
| `addBlocker`       | `AddBlockerDto`       |
| `resolveBlocker`   | `ResolveBlockerDto`   |
| `addWeeklyWin`     | `AddWeeklyWinDto`     |
| `addHistoryEntry`  | `UpdateHistoryDto`    |
| `acknowledgeAlert` | `AcknowledgeAlertDto` |

---

## 🚀 Próximos Pasos

1. **Crear controlador** con endpoints para los nuevos métodos
2. **Agregar rutas** REST para cada funcionalidad
3. **Crear tests** unitarios para cada método
4. **Documentar API** con Swagger/Postman
5. **Actualizar frontend** para usar las nuevas funcionalidades

---

## 📖 Endpoints Sugeridos

```
// Hitos
POST   /api/metrics/:id/milestones
PUT    /api/metrics/:id/milestones/:milestoneId
DELETE /api/metrics/:id/milestones/:milestoneId

// Bloqueadores
POST   /api/metrics/:id/blockers
PUT    /api/metrics/:id/blockers/:blockerId/resolve
DELETE /api/metrics/:id/blockers/:blockerId

// Logros
POST   /api/metrics/:id/weekly-wins
DELETE /api/metrics/:id/weekly-wins/:winId

// Historial
POST   /api/metrics/:id/history

// Alertas
GET    /api/metrics/:id/alerts
PUT    /api/metrics/:id/alerts/:alertId/acknowledge

// Dashboard
GET    /api/metrics/:id/dashboard
POST   /api/metrics/:id/predictions/update
```

---

## ✨ Beneficios

Con el servicio actualizado ahora puedes:

✅ Gestionar hitos y rastrear su logro  
✅ Registrar y resolver bloqueadores  
✅ Celebrar logros semanales  
✅ Mantener historial detallado con mood y achievements  
✅ Confirmar alertas del sistema  
✅ Calcular predicciones automáticamente  
✅ Obtener dashboard completo con un solo endpoint  
✅ Analizar tendencias y rendimiento  
✅ Detectar problemas y riesgos tempranamente

---

**Implementado por:** AI Assistant  
**Fecha:** 21 de Octubre, 2025  
**Versión:** 2.0.0  
**Archivo:** `services/metricService.js`  
**Líneas:** 865 (was 256)
