import { beforeEach, describe, expect, it } from 'vitest';
import { TodoStore, type Task } from './store';
import type { NamespacedStorage } from '$core/types';

/** Mock simples de NamespacedStorage usando um Map em memória. */
function makeStorage(): NamespacedStorage {
  const data = new Map<string, unknown>();
  return {
    async get<T>(key: string) {
      return (data.get(key) as T) ?? null;
    },
    async set<T>(key: string, value: T) {
      data.set(key, value);
      return value;
    },
    async remove(key: string) {
      data.delete(key);
    },
    async keys() {
      return [...data.keys()];
    },
    async iterate<T>(fn: (value: T, key: string) => void) {
      for (const [key, value] of data) {
        fn(value as T, key);
      }
    },
  };
}

function task(id: string, text: string, done = false): Task {
  return { id, text, done, createdAt: Date.now() };
}

describe('TodoStore', () => {
  let storage: NamespacedStorage;
  let store: TodoStore;

  beforeEach(() => {
    storage = makeStorage();
    store = new TodoStore(storage);
  });

  it('listByDay returns only the tasks of that day', async () => {
    await store.write('2026-05-20', [task('a', 'A'), task('b', 'B')]);
    await store.write('2026-05-21', [task('c', 'C')]);
    const day = await store.listByDay('2026-05-20');
    expect(day.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('listByDay never bleeds tasks from neighbouring days', async () => {
    await store.write('2026-05-20', [task('a', 'A')]);
    await store.write('2026-05-21', [task('b', 'B'), task('c', 'C')]);
    await store.write('2026-05-22', [task('d', 'D')]);
    expect(await store.listByDay('2026-05-21')).toHaveLength(2);
  });

  it('listByDay returns empty for a day with no tasks', async () => {
    await store.write('2026-05-20', [task('a', 'A')]);
    expect(await store.listByDay('2026-05-19')).toEqual([]);
  });

  it('serializes concurrent writes without losing data', async () => {
    // simula o usuário criando 7 tarefas rapidamente — writes em paralelo
    const date = '2026-05-21';
    const tasks: Task[] = [];
    const promises: Promise<void>[] = [];
    for (let i = 0; i < 7; i += 1) {
      tasks.push(task(`t${i}`, `Task ${i}`));
      // NÃO await — dispara em paralelo
      promises.push(store.write(date, [...tasks]));
    }
    await Promise.all(promises);
    const final = await store.listByDay(date);
    expect(final.length).toBe(7);
  });
});
