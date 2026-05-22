import type { EventBus, NamespacedStorage } from '$core/types';
import { setIndicator } from './state.svelte';

/**
 * Reúne sinais dos módulos sem que o calendário precise espiar storages alheios.
 * - todo emite `task:count-changed` ao mudar uma lista do dia
 * - notes emite `note:edited` quando o conteúdo é (in)existente
 * Na inicialização, varremos o storage uma vez para semear o índice.
 */
export async function bootstrapIndicators(
  bus: EventBus,
  todoStorage: NamespacedStorage,
  notesStorage: NamespacedStorage,
): Promise<() => void> {
  await todoStorage.iterate<Array<{ done: boolean }>>((list, key) => {
    if (!key.startsWith('tasks:')) return;
    if (!Array.isArray(list)) return;
    const date = key.replace(/^tasks:/, '');
    const pending = list.filter((t) => !t.done).length;
    setIndicator(date, { tasks: list.length, pending });
  });
  // Notas podem estar gravadas como string (formato legado) ou como NotePage[].
  await notesStorage.iterate<unknown>((value, key) => {
    if (!key.startsWith('note:')) return;
    const date = key.replace(/^note:/, '');
    let hasContent = false;
    if (typeof value === 'string') {
      hasContent = value.trim().length > 0;
    } else if (Array.isArray(value)) {
      hasContent = value.some(
        (p) =>
          (typeof p?.content === 'string' && p.content.trim().length > 0) ||
          (typeof p?.title === 'string' && p.title.trim().length > 0),
      );
    }
    if (hasContent) setIndicator(date, { note: true });
  });

  const offs = [
    bus.on('task:count-changed', ({ date, total, pending }) => {
      setIndicator(date, { tasks: total, pending });
    }),
    bus.on('note:edited', ({ date, hasContent }) => {
      setIndicator(date, { note: hasContent });
    }),
  ];
  return () => offs.forEach((o) => o());
}
