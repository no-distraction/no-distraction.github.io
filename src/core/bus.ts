import type { EventBus, EventMap, EventName } from './types';

type AnyHandler = (payload: unknown) => void;

export function createBus(): EventBus {
  const listeners = new Map<EventName, Set<AnyHandler>>();

  return {
    on<K extends EventName>(event: K, handler: (p: EventMap[K]) => void): () => void {
      let set = listeners.get(event);
      if (!set) {
        set = new Set();
        listeners.set(event, set);
      }
      set.add(handler as AnyHandler);
      return () => set!.delete(handler as AnyHandler);
    },
    emit<K extends EventName>(event: K, payload: EventMap[K]): void {
      const set = listeners.get(event);
      if (!set) return;
      for (const fn of [...set]) {
        try {
          fn(payload);
        } catch (err) {
          console.error(`[bus] handler error for "${event}"`, err);
        }
      }
    },
    clear(): void {
      listeners.clear();
    },
  };
}
