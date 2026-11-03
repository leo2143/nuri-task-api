export function emptyCompletionEvents() {
  return { taskCompleted: null, goalCompleted: null, streak: null, achievementsUnlocked: [] };
}

export function buildCompletionEvents(parts = {}) {
  const events = { ...emptyCompletionEvents(), ...parts };
  const uniqueAchievements = new Map();
  for (const achievement of events.achievementsUnlocked ?? []) {
    if (achievement?.id && !uniqueAchievements.has(achievement.id)) {
      uniqueAchievements.set(achievement.id, achievement);
    }
  }
  events.achievementsUnlocked = [...uniqueAchievements.values()];
  return events;
}

export function withCompletionEvents(result) {
  if (!result?.success) return result;
  if (result.meta?.events) return result;
  result.meta = { ...(result.meta ?? {}), events: emptyCompletionEvents() };
  return result;
}
