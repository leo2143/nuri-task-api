# Achievement DTOs

This directory contains Data Transfer Objects (DTOs) for the Achievement module.

## DTOs Available

### CreateAchievementDto
Used to create new achievements with validation.

**Required Fields:**
- `title` (string) - Achievement title
- `description` (string) - Achievement description

**Optional Fields:**
- `status` (string) - Achievement status: `locked`, `unlocked`, `completed` (default: `locked`)
- `counter` (number) - Current progress counter (default: 0)
- `countertoUnlock` (number) - Target counter to unlock/complete (default: 0)
- `reward` (string) - Achievement reward description

**Example:**
```javascript
const createDto = new CreateAchievementDto({
  title: 'Task Master',
  description: 'Complete 10 tasks',
  status: 'locked',
  counter: 0,
  countertoUnlock: 10,
  reward: 'Gold Badge'
});
```

### UpdateAchievementDto
Used to update existing achievements with validation.

**All Fields Optional:**
- `title` (string) - Achievement title
- `description` (string) - Achievement description
- `status` (string) - Achievement status: `locked`, `unlocked`, `completed`
- `counter` (number) - Current progress counter
- `countertoUnlock` (number) - Target counter to unlock/complete
- `reward` (string) - Achievement reward description

**Example:**
```javascript
const updateDto = new UpdateAchievementDto({
  counter: 5,
  status: 'unlocked'
});
```

### AchievementFilterDto
Used to filter and search achievements.

**Optional Fields:**
- `status` (string) - Filter by status: `locked`, `unlocked`, `completed`
- `search` (string) - Search in title or description
- `sortBy` (string) - Sort field: `title`, `status`, `counter`, `createdAt`, `updatedAt` (default: `createdAt`)
- `sortOrder` (string) - Sort order: `asc`, `desc` (default: `desc`)

**Example:**
```javascript
const filterDto = new AchievementFilterDto({
  status: 'unlocked',
  search: 'task',
  sortBy: 'counter',
  sortOrder: 'asc'
});
```

## Validation

All DTOs include validation methods that return:
```javascript
{
  isValid: boolean,
  errors: string[]
}
```

## Usage in Service

```javascript
import { CreateAchievementDto, UpdateAchievementDto, AchievementFilterDto } from '../models/dtos/achievements/index.js';

// Creating an achievement
const createDto = new CreateAchievementDto(data);
const validation = createDto.validate();
if (!validation.isValid) {
  return new ErrorResponseModel(validation.errors.join(', '));
}

// Convert to plain object for database operations
const cleanData = createDto.toPlainObject();
```

