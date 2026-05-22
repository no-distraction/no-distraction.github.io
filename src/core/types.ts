export type DateKey = string; // YYYY-MM-DD em hora local

export type Theme = 'light' | 'dark';

export type PomodoroPhase = 'focus' | 'short' | 'long';

export type EventMap = {
  'day:selected': { date: DateKey };
  'task:created': { date: DateKey; id: string };
  'task:completed': { date: DateKey; id: string };
  'task:uncompleted': { date: DateKey; id: string };
  'task:deleted': { date: DateKey; id: string };
  'task:count-changed': { date: DateKey; total: number; pending: number };
  'note:edited': { date: DateKey; hasContent: boolean };
  'pomodoro:started': { phase: PomodoroPhase };
  'pomodoro:cycle-completed': { phase: PomodoroPhase; durationMs: number };
  'pomodoro:config-changed': Record<string, never>;
  'water:check-toggled': { date: DateKey; index: number; checked: boolean };
  'water:goal-met': { date: DateKey; ml: number };
  'water:config-changed': Record<string, never>;
  'theme:changed': { theme: Theme };
  'data:imported': Record<string, never>;
  'data:cleared': Record<string, never>;
};

export type EventName = keyof EventMap;

export interface EventBus {
  on<K extends EventName>(event: K, handler: (payload: EventMap[K]) => void): () => void;
  emit<K extends EventName>(event: K, payload: EventMap[K]): void;
  clear(): void;
}

export interface NamespacedStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<T>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
  iterate<T>(fn: (value: T, key: string) => void): Promise<void>;
}

export interface ModuleContext {
  bus: EventBus;
  storage: NamespacedStorage;
  rootStorage: RootStorage;
}

export interface RootStorage {
  raw: NamespacedStorage;
  namespaced(prefix: string): NamespacedStorage;
  exportAll(): Promise<Record<string, unknown>>;
  importAll(data: Record<string, unknown>): Promise<void>;
  clearAll(): Promise<void>;
}

export interface AppModule {
  id: string;
  init(ctx: ModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
  publishes: readonly EventName[];
  subscribes: readonly EventName[];
}
