/**
 * Fix for EventBus test undefined checks
 * Ensures events array is not empty before accessing elements
 */
export function safeEventAccess<T>(events: T[], index: number): T {
  if (!events || events.length === 0) {
    throw new Error(`Events array is empty or undefined, cannot access index ${index}`);
  }
  return events[index];
}