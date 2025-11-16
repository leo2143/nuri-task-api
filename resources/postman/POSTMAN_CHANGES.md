# 📬 Cambios en la Colección de Postman

## 🔄 Actualización: UserMetrics Architecture

La colección de Postman ha sido actualizada para reflejar la nueva arquitectura de métricas del sistema.

---

## ✅ Cambios Aplicados

### 1. **Renombrada carpeta `metrics` → `user-metrics`**

La carpeta de métricas ahora refleja que son **métricas generales del usuario**, no métricas por goal.

### 2. **Endpoints Actualizados**

#### ❌ **Eliminados** (obsoletos):
```
POST   /api/metrics                     # Crear métrica por goal
GET    /api/metrics                     # Listar todas las métricas
GET    /api/metrics/:id                 # Obtener métrica por ID
PUT    /api/metrics/:id                 # Actualizar métrica
DELETE /api/metrics/:id                 # Eliminar métrica
GET    /api/goals/:goalId/metrics       # Obtener métrica de un goal
POST   /api/metrics/:id/history         # Agregar entrada al historial
GET    /api/metrics/:id/dashboard       # Dashboard de métrica
```

#### ✅ **Agregados** (nueva arquitectura):
```
GET    /api/user-metrics                # Obtener mis métricas generales (auto-crea si no existe)
GET    /api/user-metrics/dashboard      # Dashboard con rachas, totales y estadísticas
POST   /api/user-metrics/check-streaks  # Verificar y actualizar rachas manualmente
```

### 3. **Nuevo Endpoint para Tareas**

Se agregó un endpoint específico para actualizar solo el estado `completed` de una tarea:

```
PATCH  /api/todos/:id/state
Body: { "completed": true }
```

**Beneficios:**
- ✅ Más eficiente (solo actualiza un campo)
- ✅ Actualiza automáticamente las métricas del usuario
- ✅ Actualiza automáticamente el progreso del goal asociado
- ✅ No limpia otros campos accidentalmente

---

## 📊 Nueva Arquitectura de Métricas

### **UserMetrics** (Métricas Generales del Usuario)
- **Una métrica por usuario** (no por goal)
- Rastrea actividad global del usuario
- Se crea automáticamente al hacer la primera petición

**Campos principales:**
```json
{
  "userId": "ObjectId",
  "currentStreak": 4,           // Racha actual (días consecutivos)
  "bestStreak": 7,              // Mejor racha histórica
  "totalTasksCompleted": 12,    // Total de tareas completadas
  "totalGoalsCompleted": 1,     // Total de metas completadas
  "lastActivityDate": "Date",
  "history": [
    {
      "date": "Date",
      "tasksCompleted": 3
    }
  ]
}
```

### **Goals** (Tracking Embebido)
- Cada goal tiene sus propios campos de tracking embebidos
- **NO tiene relación con UserMetrics**

**Nuevos campos en Goal:**
```json
{
  "totalSubGoals": 0,
  "completedSubGoals": 0,
  "totalTasks": 5,
  "completedTasks": 2,
  "progress": 40              // Calculado automáticamente
}
```

---

## 🔄 Actualización Automática

Cuando completas una tarea:
1. ✅ Se actualiza `UserMetrics` (rachas, totales)
2. ✅ Se actualiza el `Goal` asociado (si existe)
3. ✅ Todo es automático, no necesitas llamar endpoints adicionales

---

## 📝 Ejemplo de Uso

### 1. **Obtener mis métricas generales**
```http
GET {{localhost}}/api/user-metrics
Authorization: Bearer {{token_auth}}
```

**Respuesta:**
```json
{
  "status": 200,
  "success": true,
  "message": "Métricas del usuario obtenidas correctamente",
  "data": {
    "currentStreak": 4,
    "bestStreak": 7,
    "totalTasksCompleted": 12,
    "totalGoalsCompleted": 1,
    "history": [...]
  }
}
```

### 2. **Completar una tarea (actualiza métricas automáticamente)**
```http
PATCH {{localhost}}/api/todos/68d1e7f577ec3fe8073cef11/state
Authorization: Bearer {{token_auth}}
Content-Type: application/json

{
  "completed": true
}
```

**Resultado:**
- ✅ Tarea marcada como completada
- ✅ `UserMetrics.totalTasksCompleted` incrementado
- ✅ Racha actualizada (si es un día consecutivo)
- ✅ Progreso del goal actualizado (si está asociado)

### 3. **Ver dashboard motivacional**
```http
GET {{localhost}}/api/user-metrics/dashboard
Authorization: Bearer {{token_auth}}
```

**Respuesta:**
```json
{
  "status": 200,
  "success": true,
  "data": {
    "currentStreak": 4,
    "bestStreak": 7,
    "totalTasksCompleted": 12,
    "totalGoalsCompleted": 1,
    "recentActivity": [...],
    "motivationalMessage": "¡Vas genial! 🔥"
  }
}
```

---

## 🎯 Ventajas de la Nueva Arquitectura

1. **Simplicidad**: Una métrica por usuario (no múltiples por goals)
2. **Automatización**: Las métricas se actualizan solas al completar tareas
3. **Consistencia**: El progreso de goals se calcula en tiempo real
4. **Performance**: Menos consultas a la base de datos
5. **Escalabilidad**: Mejor estructura para futuros features

---

## 📚 Documentación Adicional

- Ver `INFORME_BACKEND.md` para detalles técnicos
- Ver `models/userMetricsModel.js` para el schema completo
- Ver `services/userMetricsService.js` para la lógica de negocio
- Ver `models/goalsModel.js` para los campos de tracking embebidos

---

**Última actualización:** 8 de Noviembre, 2025

