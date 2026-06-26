/** Central registry of React Query cache keys so invalidation stays consistent. */
export const sceneKeys = {
  list: () => ["scenes"] as const,
  detail: (id: string) => ["scene", id] as const,
  events: (id: string) => ["events", id] as const,
};
