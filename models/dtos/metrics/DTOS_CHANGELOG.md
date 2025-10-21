# Changelog - DTOs de Métricas Actualizados

## 📅 Fecha: 21 de Octubre, 2025

## 🎯 Resumen de Cambios

Se han actualizado y creado **8 DTOs** para soportar el modelo de métricas enriquecido, agregando soporte para hitos, bloqueadores, logros semanales, alertas y métricas avanzadas.

---

## ✅ DTOs Actualizados

### 1. **CreateMetricDto.js** ⬆️ ACTUALIZADO

**Campos Agregados:**

- `totalCompletedTasks` - Total de tareas completadas
- `totalTasks` - Total de tareas
- `missingTasks` - Tareas faltantes
- `milestones` - Array de hitos de la meta
- `currentStreak` - Racha actual (auto-inicializado en 0)
- `bestStreak` - Mejor racha (auto-inicializado en 0)
- `estimatedTimeInvested` - Tiempo invertido en horas
- `qualityScore` - Puntuación de calidad (0-5)
- `expectedProgress` - Progreso esperado
- `blockers` - Array de bloqueadores
- `weeklyWins` - Array de logros semanales
- `taskBreakdown` - Objeto con desglose por prioridad
  - `highPriority`
  - `mediumPriority`
  - `lowPriority`
- `overdueTasks` - Tareas vencidas
- `onTimeCompletionRate` - Tasa de completado a tiempo
- `alerts` - Array de alertas (auto-inicializado vacío)
- `healthStatus` - Estado de salud (auto-inicializado en 'good')

**Validaciones Agregadas:**

- Validación de rangos para métricas numéricas
- Validación de estructura de arrays (milestones, blockers, weeklyWins)
- Validación de enums (severity, mood)
- Validación de taskBreakdown como objeto

**Líneas de código:** 73 → 233 (+160 líneas)

---

### 2. **UpdateMetricDto.js** ⬆️ ACTUALIZADO

**Campos Agregados:**

- `totalCompletedTasks` - Actualizar tareas completadas
- `totalTasks` - Actualizar total de tareas
- `missingTasks` - Actualizar tareas faltantes
- `estimatedTimeInvested` - Actualizar tiempo invertido
- `qualityScore` - Actualizar puntuación de calidad
- `expectedProgress` - Actualizar progreso esperado
- `projectedCompletionDate` - Actualizar fecha proyectada
- `taskBreakdown` - Actualizar desglose de tareas
- `overdueTasks` - Actualizar tareas vencidas
- `onTimeCompletionRate` - Actualizar tasa de completado

**Validaciones Agregadas:**

- Todas las validaciones necesarias para los nuevos campos
- Validación de fecha para `projectedCompletionDate`
- Validación de objeto para `taskBreakdown`

**Líneas de código:** 72 → 183 (+111 líneas)

---

## 🆕 DTOs Nuevos Creados

### 3. **AddMilestoneDto.js** 🆕 NUEVO

**Propósito:** Agregar hitos a una métrica

**Campos:**

- `name` (requerido) - Nombre del hito
- `targetProgress` (opcional) - Progreso objetivo (0-100)
- `description` (opcional) - Descripción del hito
- `achieved` (auto: false) - Estado de logro

**Validaciones:**

- Name requerido y no vacío
- targetProgress entre 0 y 100
- description como string

**Uso:**

```javascript
const dto = new AddMilestoneDto({
  name: 'Prototipo inicial',
  targetProgress: 30,
  description: 'Completar el MVP',
});
```

**Líneas de código:** 68

---

### 4. **AddBlockerDto.js** 🆕 NUEVO

**Propósito:** Agregar bloqueadores a una métrica

**Campos:**

- `description` (requerido) - Descripción del bloqueador
- `severity` (opcional, default: 'medium') - low/medium/high/critical
- `resolved` (auto: false) - Estado de resolución
- `createdAt` (auto: Date.now) - Fecha de creación

**Validaciones:**

- Description requerido y no vacío
- Severity debe ser uno de los valores permitidos

**Uso:**

```javascript
const dto = new AddBlockerDto({
  description: 'API externa no disponible',
  severity: 'critical',
});
```

**Líneas de código:** 62

---

### 5. **AddWeeklyWinDto.js** 🆕 NUEVO

**Propósito:** Agregar logros semanales a una métrica

**Campos:**

- `description` (requerido) - Descripción del logro
- `week` (requerido) - Semana del logro
- `date` (auto: Date.now) - Fecha del logro

**Validaciones:**

- Description requerido y no vacío
- Week requerido y no vacío

**Uso:**

```javascript
const dto = new AddWeeklyWinDto({
  description: 'Completamos todas las pruebas',
  week: 'Semana 3',
});
```

**Líneas de código:** 55

---

### 6. **UpdateHistoryDto.js** 🆕 NUEVO

**Propósito:** Agregar entradas al historial de métricas

**Campos:**

- `week` (requerido) - Semana
- `totalCompletedTasks` (opcional) - Tareas completadas
- `totalTasks` (opcional) - Total de tareas
- `missingTasks` (opcional) - Tareas faltantes
- `progress` (opcional) - Progreso (0-100)
- `timeInvested` (opcional) - Tiempo invertido (horas)
- `notes` (opcional) - Notas de la semana
- `mood` (opcional) - motivated/neutral/challenged/frustrated
- `achievements` (opcional) - Array de logros

**Validaciones:**

- Week requerido
- Progress entre 0 y 100
- Mood debe ser uno de los valores permitidos
- Achievements debe ser array de strings

**Uso:**

```javascript
const dto = new UpdateHistoryDto({
  week: 'Semana 2',
  progress: 30,
  timeInvested: 12,
  mood: 'motivated',
  achievements: ['Completé el login', 'Arreglé 5 bugs'],
});
```

**Líneas de código:** 123

---

### 7. **ResolveBlockerDto.js** 🆕 NUEVO

**Propósito:** Resolver/marcar bloqueadores como resueltos

**Campos:**

- `blockerId` (requerido) - ID del bloqueador
- `resolved` (opcional, default: true) - Estado de resolución
- `resolvedAt` (auto) - Fecha de resolución

**Validaciones:**

- blockerId requerido y no vacío
- resolved debe ser booleano

**Uso:**

```javascript
const dto = new ResolveBlockerDto({
  blockerId: '60d5ec49f1b2c8b1f8e4e1a2',
  resolved: true,
});
```

**Líneas de código:** 57

---

### 8. **AcknowledgeAlertDto.js** 🆕 NUEVO

**Propósito:** Confirmar/marcar alertas como leídas

**Campos:**

- `alertId` (requerido) - ID de la alerta
- `acknowledged` (opcional, default: true) - Estado de confirmación

**Validaciones:**

- alertId requerido y no vacío
- acknowledged debe ser booleano

**Uso:**

```javascript
const dto = new AcknowledgeAlertDto({
  alertId: '60d5ec49f1b2c8b1f8e4e1a3',
  acknowledged: true,
});
```

**Líneas de código:** 52

---

## 📦 Archivos Modificados/Creados

```
models/dtos/metrics/
├── CreateMetricDto.js        ⬆️ ACTUALIZADO (73 → 233 líneas)
├── UpdateMetricDto.js        ⬆️ ACTUALIZADO (72 → 183 líneas)
├── AddMilestoneDto.js        🆕 NUEVO (68 líneas)
├── AddBlockerDto.js          🆕 NUEVO (62 líneas)
├── AddWeeklyWinDto.js        🆕 NUEVO (55 líneas)
├── UpdateHistoryDto.js       🆕 NUEVO (123 líneas)
├── ResolveBlockerDto.js      🆕 NUEVO (57 líneas)
├── AcknowledgeAlertDto.js    🆕 NUEVO (52 líneas)
├── index.js                  ⬆️ ACTUALIZADO (exporta 8 DTOs)
├── README.md                 🆕 NUEVO (documentación completa)
└── DTOS_CHANGELOG.md         🆕 NUEVO (este archivo)
```

---

## 📊 Estadísticas

- **Total de DTOs:** 8
- **DTOs actualizados:** 2
- **DTOs nuevos:** 6
- **Líneas de código agregadas:** ~840 líneas
- **Validaciones agregadas:** ~60 validaciones
- **Campos nuevos soportados:** ~25 campos

---

## 🔄 Compatibilidad

### ✅ Retrocompatible

Los DTOs existentes (`CreateMetricDto` y `UpdateMetricDto`) mantienen compatibilidad hacia atrás:

- Todos los campos nuevos son **opcionales**
- Los campos existentes funcionan igual
- Los valores por defecto se aplican automáticamente

### ⚠️ Cambios a considerar

1. **CreateMetricDto** ahora inicializa más campos automáticamente
2. **UpdateMetricDto** soporta actualizar muchos más campos
3. Los servicios pueden necesitar actualización para usar los nuevos DTOs

---

## 🚀 Próximos Pasos Recomendados

1. **Actualizar el servicio de métricas** para usar los nuevos DTOs:
   - `addMilestone(metricId, milestoneData)`
   - `addBlocker(metricId, blockerData)`
   - `addWeeklyWin(metricId, winData)`
   - `resolveBlocker(metricId, blockerId)`
   - `acknowledgeAlert(metricId, alertId)`

2. **Crear endpoints en el controlador:**
   - `POST /metrics/:id/milestones`
   - `POST /metrics/:id/blockers`
   - `PUT /metrics/:id/blockers/:blockerId/resolve`
   - `POST /metrics/:id/weekly-wins`
   - `PUT /metrics/:id/alerts/:alertId/acknowledge`

3. **Actualizar la documentación de la API** con los nuevos endpoints

4. **Crear tests unitarios** para los nuevos DTOs

5. **Actualizar el frontend** para usar las nuevas funcionalidades

---

## 📖 Documentación

- **README.md:** Guía completa de uso con ejemplos
- **METRICS_MODEL_USAGE.md:** Guía del modelo enriquecido
- **Este archivo:** Changelog de cambios

---

## ✨ Beneficios

Con estos DTOs actualizados ahora puedes:

✅ Validar todos los campos del modelo enriquecido  
✅ Agregar hitos y rastrear su logro  
✅ Gestionar bloqueadores con severidad  
✅ Celebrar logros semanales  
✅ Mantener historial detallado con mood y achievements  
✅ Resolver bloqueadores de forma controlada  
✅ Confirmar alertas del sistema  
✅ Actualizar métricas avanzadas (calidad, eficiencia, etc.)  
✅ Mantener código limpio y validado

---

**Implementado por:** AI Assistant  
**Fecha:** 21 de Octubre, 2025  
**Versión:** 2.0.0
