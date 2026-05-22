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

  it('allPending returns ALL not-done tasks across days', async () => {
    await store.write('2026-05-20', [
      task('a', 'A'),
      task('b', 'B'),
      task('c', 'C'),
      task('d', 'D'),
      task('e', 'E'),
      task('f', 'F'),
      task('g', 'G'),
    ]);
    const pending = await store.allPending();
    expect(pending.length).toBe(7);
    expect(pending.map((p) => p.task.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('allPending filters out done tasks', async () => {
    await store.write('2026-05-20', [
      task('a', 'A', false),
      task('b', 'B', true),
      task('c', 'C', false),
    ]);
    const pending = await store.allPending();
    expect(pending.map((p) => p.task.id).sort()).toEqual(['a', 'c']);
  });

  it('allCompleted returns only done tasks', async () => {
    await store.write('2026-05-20', [
      task('a', 'A', false),
      task('b', 'B', true),
      task('c', 'C', true),
    ]);
    const completed = await store.allCompleted();
    expect(completed.map((p) => p.task.id).sort()).toEqual(['b', 'c']);
  });

  it('allPending aggregates across days', async () => {
    await store.write('2026-05-20', [task('a', 'A')]);
    await store.write('2026-05-21', [task('b', 'B'), task('c', 'C')]);
    await store.write('2026-05-22', [task('d', 'D')]);
    const pending = await store.allPending();
    expect(pending.length).toBe(4);
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
