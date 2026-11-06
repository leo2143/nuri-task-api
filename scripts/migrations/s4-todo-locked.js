import mongoose from 'mongoose';
import { runMigration } from './support/cli.js';

/**
 * S4: marca como bloqueadas (isLocked) las tareas completadas antes de que existiera el bloqueo.
 * Filtro idempotente: una segunda corrida no encuentra nada para modificar.
 *
 *   node scripts/migrations/s4-todo-locked.js            (dry-run)
 *   node scripts/migrations/s4-todo-locked.js --apply
 *   node scripts/migrations/s4-todo-locked.js --restore --apply
 */
const LEGACY_COMPLETED_FILTER = { completed: true, isLocked: { $ne: true } };

await runMigration({
  name: 's4-todo-locked',
  handlers: {
    async run({ apply, log, backup }) {
      const todos = mongoose.connection.collection('todos');
      const legacyTodos = await todos.find(LEGACY_COMPLETED_FILTER).toArray();
      log(`Tareas completadas sin lock: ${legacyTodos.length}`);

      if (!apply || legacyTodos.length === 0) return;

      const backupPath = backup({ collection: 'todos', documents: legacyTodos });
      log(`Backup: ${backupPath}`);

      const result = await todos.updateMany(LEGACY_COMPLETED_FILTER, { $set: { isLocked: true } });
      log(`Modificadas: ${result.modifiedCount}`);
    },
  },
});
