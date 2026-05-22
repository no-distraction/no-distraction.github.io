import type { DateKey, NamespacedStorage } from '$core/types';

export type NotePage = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
};

export const KEY = (date: DateKey) => `note:${date}`;

/** Carrega notas do dia, migrando do formato antigo (string única) se necessário. */
export async function loadPages(storage: NamespacedStorage, date: DateKey): Promise<NotePage[]> {
  const raw = await storage.get<NotePage[] | string>(KEY(date));
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    return [{ id: crypto.randomUUID(), title: 'Nota', content: raw, createdAt: Date.now() }];
  }
  return [];
}

export async function savePages(storage: NamespacedStorage, date: DateKey, pages: NotePage[]): Promise<void> {
  const meaningful = pages.filter((p) => p.title.trim() || p.content.trim());
  if (meaningful.length === 0) {
    await storage.remove(KEY(date));
  } else {
    await storage.set(KEY(date), pages);
  }
}

export function newPage(title = 'nova nota'): NotePage {
  return { id: crypto.randomUUID(), title, content: '', createdAt: Date.now() };
}

export function hasContent(pages: NotePage[]): boolean {
  return pages.some((p) => p.content.trim().length > 0 || p.title.trim().length > 0);
}
