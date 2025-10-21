# DTOs de Métricas

Este directorio contiene los Data Transfer Objects (DTOs) para el manejo de métricas en el sistema.

## 📋 DTOs Disponibles

### 1. **CreateMetricDto**

DTO para crear una nueva métrica asociada a una meta.

**Uso:**

```javascript
import { CreateMetricDto } from './models/dtos/metrics/index.js';

const metricData = {
  GoalId: '60d5ec49f1b2c8b1f8e4e1a1',
  currentWeek: 'Semana 1',
  currentProgress: 15,
  currentNotes: 'Buen inicio',
  totalCompletedTasks: 5,
  totalTasks: 20,
  milestones: [
    {
      name: 'Prototipo inicial',
      targetProgress: 30,
      description: 'Completar el MVP',
    },
  ],
  blockers: [
    {
      description: 'Falta acceso a la API',
      severity: 'high',
    },
  ],
  estimatedTimeInvested: 10,
  qualityScore: 4,
};

const dto = new CreateMetricDto(metricData);
const validation = dto.validate();

if (validation.isValid) {
  const cleanData = dto.toPlainObject();
  // Usar cleanData para crear la métrica
}
```

### 2. **UpdateMetricDto**

DTO para actualizar una métrica existente.

**Uso:**

```javascript
import { UpdateMetricDto } from './models/dtos/metrics/index.js';

const updateData = {
  currentWeek: 'Semana 2',
  currentProgress: 35,
  totalCompletedTasks: 12,
  estimatedTimeInvested: 25,
  qualityScore: 4.5,
};

const dto = new UpdateMetricDto(updateData);
const validation = dto.validate();

if (validation.isValid) {
  const cleanData = dto.toPlainObject();
  // Usar cleanData para actualizar la métrica
}
```

### 3. **AddMilestoneDto**

DTO para agregar un hito a una métrica.

**Uso:**

```javascript
import { AddMilestoneDto } from './models/dtos/metrics/index.js';

const milestoneData = {
  name: 'Beta Testing',
  targetProgress: 75,
  description: 'Tener una versión lista para pruebas',
};

const dto = new AddMilestoneDto(milestoneData);
const validation = dto.validate();

if (validation.isValid) {
  const milestone = dto.toPlainObject();
  // Agregar milestone al array de milestones
  metric.milestones.push(milestone);
  await metric.save();
}
```

### 4. **AddBlockerDto**

DTO para agregar un bloqueador a una métrica.

**Uso:**

```javascript
import { AddBlockerDto } from './models/dtos/metrics/index.js';

const blockerData = {
  description: 'API externa no está respondiendo',
  severity: 'critical', // 'low', 'medium', 'high', 'critical'
};

const dto = new AddBlockerDto(blockerData);
const validation = dto.validate();

if (validation.isValid) {
  const blocker = dto.toPlainObject();
  metric.blockers.push(blocker);
  await metric.save();
}
```

### 5. **AddWeeklyWinDto**

DTO para agregar un logro semanal a una métrica.

**Uso:**

```javascript
import { AddWeeklyWinDto } from './models/dtos/metrics/index.js';

const winData = {
  description: 'Completamos todas las pruebas unitarias',
  week: 'Semana 3',
};

const dto = new AddWeeklyWinDto(winData);
const validation = dto.validate();

if (validation.isValid) {
  const win = dto.toPlainObject();
  metric.weeklyWins.push(win);
  await metric.save();
}
```

### 6. **UpdateHistoryDto**

DTO para agregar una entrada al historial de la métrica.

**Uso:**

```javascript
import { UpdateHistoryDto } from './models/dtos/metrics/index.js';

const historyData = {
  week: 'Semana 2',
  totalCompletedTasks: 10,
  totalTasks: 25,
  missingTasks: 15,
  progress: 30,
  timeInvested: 12,
  notes: 'Semana muy productiva',
  mood: 'motivated', // 'motivated', 'neutral', 'challenged', 'frustrated'
  achievements: ['Completé el módulo de autenticación', 'Arreglé 5 bugs críticos'],
};

const dto = new UpdateHistoryDto(historyData);
const validation = dto.validate();

if (validation.isValid) {
  const historyEntry = dto.toPlainObject();
  metric.history.push(historyEntry);
  await metric.save();
}
```

### 7. **ResolveBlockerDto**

DTO para marcar un bloqueador como resuelto.

**Uso:**

```javascript
import { ResolveBlockerDto } from './models/dtos/metrics/index.js';

const resolveData = {
  blockerId: '60d5ec49f1b2c8b1f8e4e1a2',
  resolved: true,
};

const dto = new ResolveBlockerDto(resolveData);
const validation = dto.validate();

if (validation.isValid) {
  const { blockerId, resolved, resolvedAt } = dto.toPlainObject();
  const blocker = metric.blockers.id(blockerId);
  blocker.resolved = resolved;
  blocker.resolvedAt = resolvedAt;
  await metric.save();
}
```

### 8. **AcknowledgeAlertDto**

DTO para confirmar/marcar como leída una alerta.

**Uso:**

```javascript
import { AcknowledgeAlertDto } from './models/dtos/metrics/index.js';

const acknowledgeData = {
  alertId: '60d5ec49f1b2c8b1f8e4e1a3',
  acknowledged: true,
};

const dto = new AcknowledgeAlertDto(acknowledgeData);
const validation = dto.validate();

if (validation.isValid) {
  const { alertId, acknowledged } = dto.toPlainObject();
  const alert = metric.alerts.id(alertId);
  alert.acknowledged = acknowledged;
  await metric.save();
}
```

## 🔍 Validación

Todos los DTOs incluyen un método `validate()` que retorna:

```javascript
{
  isValid: boolean,
  errors: string[]
}
```

**Ejemplo completo con manejo de errores:**

```javascript
const dto = new CreateMetricDto(data);
const validation = dto.validate();

if (!validation.isValid) {
  console.error('Errores de validación:', validation.errors);
  return res.status(400).json({
    success: false,
    errors: validation.errors,
  });
}

const cleanData = dto.toPlainObject();
const metric = new Metrics(cleanData);
await metric.save();
```

## 📝 Campos Opcionales vs Requeridos

### CreateMetricDto

**Requeridos:**

- `GoalId`
- `currentWeek`

**Opcionales (con valores por defecto):**

- `currentProgress` (0)
- `currentNotes` ('')
- `totalCompletedTasks` (0)
- `totalTasks` (0)
- `milestones` ([])
- `blockers` ([])
- `weeklyWins` ([])
- Y todos los demás campos numéricos

### UpdateMetricDto

**Todos los campos son opcionales** - Solo actualiza lo que se envíe.

### Sub-document DTOs

#### AddMilestoneDto

- **Requerido:** `name`
- **Opcional:** `targetProgress`, `description`

#### AddBlockerDto

- **Requerido:** `description`
- **Opcional:** `severity` (default: 'medium')

#### AddWeeklyWinDto

- **Requeridos:** `description`, `week`

#### UpdateHistoryDto

- **Requerido:** `week`
- **Opcionales:** Todos los demás campos de métricas

#### ResolveBlockerDto

- **Requerido:** `blockerId`
- **Opcional:** `resolved` (default: true)

#### AcknowledgeAlertDto

- **Requerido:** `alertId`
- **Opcional:** `acknowledged` (default: true)

## 🎯 Mejores Prácticas

1. **Siempre valida antes de usar:**

   ```javascript
   const validation = dto.validate();
   if (!validation.isValid) {
     // Manejar errores
   }
   ```

2. **Usa toPlainObject() para obtener datos limpios:**

   ```javascript
   const cleanData = dto.toPlainObject();
   ```

3. **Los DTOs sanitizan automáticamente:**
   - Trimean strings
   - Validan rangos numéricos
   - Verifican tipos de datos
   - Aplican valores por defecto

4. **Para arrays de sub-documentos:**

   ```javascript
   // ✅ Correcto
   const dto = new AddMilestoneDto(milestoneData);
   if (dto.validate().isValid) {
     metric.milestones.push(dto.toPlainObject());
   }

   // ❌ Incorrecto
   metric.milestones.push(milestoneData); // Sin validación
   ```

## 🔗 Integración con Servicios

Ejemplo de cómo usar en un servicio:

```javascript
// services/metricService.js
import { CreateMetricDto, AddBlockerDto } from '../models/dtos/metrics/index.js';

export class MetricService {
  static async createMetric(metricData, userId) {
    // Validar con DTO
    const createDto = new CreateMetricDto(metricData);
    const validation = createDto.validate();

    if (!validation.isValid) {
      return new ErrorResponseModel(validation.errors.join(', '));
    }

    // Obtener datos limpios
    const cleanData = createDto.toPlainObject();

    // Crear métrica
    const metric = new Metrics(cleanData);
    await metric.save();

    return new CreatedResponseModel(metric, 'Métrica creada');
  }

  static async addBlocker(metricId, blockerData, userId) {
    const metric = await Metrics.findById(metricId);

    // Validar bloqueador con DTO
    const dto = new AddBlockerDto(blockerData);
    const validation = dto.validate();

    if (!validation.isValid) {
      return new ErrorResponseModel(validation.errors.join(', '));
    }

    // Agregar bloqueador
    metric.blockers.push(dto.toPlainObject());
    await metric.save();

    return new SuccessResponseModel(metric, 1, 'Bloqueador agregado');
  }
}
```

## 📚 Ver También

- [Modelo de Métricas](../../metricsModel.js)
- [Guía de Uso del Modelo](../../METRICS_MODEL_USAGE.md)
- [Servicio de Métricas](../../../services/metricService.js)
