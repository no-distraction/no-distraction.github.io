import type { RootStorage } from './types';

export const CURRENT_SCHEMA_VERSION = 1;
const META_KEY = '_meta:schemaVersion';

type Migration = (storage: RootStorage) => Promise<void>;

const migrations: Record<number, Migration> = {
  // 0 -> 1 : pristine. Nothing to do.
};

export async function runMigrations(storage: RootStorage): Promise<void> {
  const current = ((await storage.raw.get<number>(META_KEY)) ?? 0) as number;
  for (let v = current + 1; v <= CURRENT_SCHEMA_VERSION; v += 1) {
    const m = migrations[v];
    if (m) {
      await m(storage);
    }
  }
  await storage.raw.set(META_KEY, CURRENT_SCHEMA_VERSION);
}
