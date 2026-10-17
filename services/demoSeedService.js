import Goal from '../models/goalsModel.js';
import Todo from '../models/todoModel.js';
import User from '../models/userModel.js';
import { DemoSeedClockDto } from '../models/dtos/admin/DemoSeedClockDto.js';
import {
  formatDateYmdInTimeZone,
  getDayRangeInTimeZone,
} from './helpers/dateTime.js';
import {
  SuccessResponseModel,
  BadRequestResponseModel,
  NotFoundResponseModel,
  ErrorResponseModel,
} from '../models/responseModel.js';

const DEMO_TITLE_PREFIX = '[Demo]';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Fecha de vencimiento de producto: YMD ART + T12:00Z.
 */
function productDueDateFromOffset(daysFromToday) {
  const { start } = getDayRangeInTimeZone(daysFromToday);
  const ymd = formatDateYmdInTimeZone(start);
  return new Date(`${ymd}T12:00:00.000Z`);
}

function isDemoTitle(title) {
  return typeof title === 'string' && title.startsWith(DEMO_TITLE_PREFIX);
}

function dueDateForTitle(title) {
  if (title.includes('Overdue yday') || title.includes('Task yday')) {
    return productDueDateFromOffset(-1);
  }
  if (title.includes('Backlog')) {
    return productDueDateFromOffset(-8);
  }
  return null;
}

/**
 * Atrasa relojes de documentos [Demo] para disparar crons (due pasado, stalled, pausa).
 */
export class DemoSeedService {
  static async applyClock(body) {
    try {
      const dto = new DemoSeedClockDto(body);
      const validation = dto.validate();
      if (!validation.isValid) {
        return new BadRequestResponseModel(validation.errors.join(', '));
      }

      const { userId } = dto.toPlainObject();
      const user = await User.findById(userId);
      if (!user) {
        return new NotFoundResponseModel('Usuario de demo no encontrado');
      }

      const stalledAt = new Date(Date.now() - 8 * MS_PER_DAY);
      const pausedAt = new Date(Date.now() - 15 * MS_PER_DAY);
      const subscriptionStart = new Date(Date.now() - 8 * MS_PER_DAY);

      const goals = await Goal.find({ userId, title: { $regex: /^\[Demo\]/ } });
      const todos = await Todo.find({ userId, title: { $regex: /^\[Demo\]/ } });

      let goalsPatched = 0;
      for (const goal of goals) {
        if (!isDemoTitle(goal.title)) {
          continue;
        }

        let changed = false;
        const dueDate = dueDateForTitle(goal.title);
        if (dueDate) {
          goal.dueDate = dueDate;
          changed = true;
        }
        if (goal.title.includes('Stalled')) {
          goal.lastChildActivity = stalledAt;
          changed = true;
        }
        if (goal.title.includes('Paused long')) {
          goal.status = 'paused';
          goal.pausedAt = pausedAt;
          changed = true;
        }
        if (changed) {
          await goal.save();
          goalsPatched += 1;
        }
      }

      let todosPatched = 0;
      for (const todo of todos) {
        if (!isDemoTitle(todo.title)) {
          continue;
        }

        const dueDate = dueDateForTitle(todo.title);
        if (dueDate) {
          todo.dueDate = dueDate;
          await todo.save();
          todosPatched += 1;
        }
      }

      let userPatched = false;
      if (user.subscription?.isActive) {
        user.subscription.startDate = subscriptionStart;
        await user.save();
        userPatched = true;
      }

      return new SuccessResponseModel(
        {
          userId,
          goalsPatched,
          todosPatched,
          userPatched,
          stalledAt,
          pausedAt,
        },
        'Reloj de demo aplicado a documentos [Demo]'
      );
    } catch (error) {
      return new ErrorResponseModel(`Error aplicando reloj de demo: ${error.message}`, 500);
    }
  }
}
