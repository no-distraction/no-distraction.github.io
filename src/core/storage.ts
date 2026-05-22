import localforage from 'localforage';
import type { NamespacedStorage, RootStorage } from './types';

const APP_NAME = 'no-distraction';

localforage.config({
  name: APP_NAME,
  storeName: 'kv',
  description: 'Local-only storage for No Distraction',
});

/**
 * IndexedDB usa structured clone para gravar. Proxies do Svelte 5 ($state)
 * NÃO são cloneáveis e geram DataCloneError. Antes de gravar qualquer objeto,
 * passamos por JSON.parse(JSON.stringify(...)) para obter um POJO equivalente.
 */
function toPlain<T>(value: T): T {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function namespaced(prefix: string): NamespacedStorage {
  const ns = `${prefix}:`;
  const strip = (k: string) => k.slice(ns.length);
  const matches = (k: string) => k.startsWith(ns);

  return {
    async get<T>(key: string) {
      return (await localforage.getItem<T>(ns + key)) ?? null;
    },
    async set<T>(key: string, value: T) {
      try {
        return await localforage.setItem<T>(ns + key, toPlain(value));
      } catch (err) {
        console.error('[storage] set failed', err);
        throw err;
      }
    },
    async remove(key: string) {
      await localforage.removeItem(ns + key);
    },
    async keys() {
      const all = await localforage.keys();
      return all.filter(matches).map(strip);
    },
    async iterate<T>(fn: (value: T, key: string) => void) {
      await localforage.iterate<T, void>((value, key) => {
        if (matches(key)) fn(value, strip(key));
      });
    },
  };
}

const raw: NamespacedStorage = {
  async get<T>(key: string) {
    return (await localforage.getItem<T>(key)) ?? null;
  },
  async set<T>(key: string, value: T) {
    return await localforage.setItem<T>(key, toPlain(value));
  },
  async remove(key: string) {
    await localforage.removeItem(key);
  },
  async keys() {
    return await localforage.keys();
  },
  async iterate<T>(fn: (value: T, key: string) => void) {
    await localforage.iterate<T, void>((value, key) => {
      fn(value, key);
    });
  },
};

export const rootStorage: RootStorage = {
  raw,
  namespaced,
  async exportAll() {
    const out: Record<string, unknown> = {};
    await localforage.iterate<unknown, void>((value, key) => {
      out[key] = value;
    });
    return out;
  },
  async importAll(data) {
    await localforage.clear();
    for (const [key, value] of Object.entries(data)) {
      await localforage.setItem(key, toPlain(value));
    }
  },
  async clearAll() {
    await localforage.clear();
  },
};

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!('storage' in navigator) || !navigator.storage.estimate) return null;
  const est = await navigator.storage.estimate();
  return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
}
