import type { EventBus } from '$core/types';
import { addDays } from '$core/date';
import { app } from './state.svelte';

type ShortcutCtx = {
  bus: EventBus;
  togglePomodoro: () => void;
  toggleTheme: () => void;
};

export function installShortcuts(ctx: ShortcutCtx): () => void {
  function onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    const inEditable =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable);

    if (e.key === '?' && e.shiftKey && !inEditable) {
      e.preventDefault();
      app.showShortcuts = !app.showShortcuts;
      return;
    }
    if (e.key === 'Escape') {
      if (app.showSettings) app.showSettings = false;
      if (app.showShortcuts) app.showShortcuts = false;
      return;
    }
    if (e.ctrlKey && e.key === ',') {
      e.preventDefault();
      app.showSettings = !app.showSettings;
      return;
    }

    if (inEditable) return;

    switch (e.key) {
      case ' ': {
        e.preventDefault();
        ctx.togglePomodoro();
        break;
      }
      case 'ArrowLeft': {
        const next = addDays(app.selectedDate, -1);
        app.selectedDate = next;
        ctx.bus.emit('day:selected', { date: next });
        break;
      }
      case 'ArrowRight': {
        const next = addDays(app.selectedDate, 1);
        app.selectedDate = next;
        ctx.bus.emit('day:selected', { date: next });
        break;
      }
      case 't':
      case 'T': {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('[data-shortcut="new-task"]');
        el?.focus();
        break;
      }
      case 'n':
      case 'N': {
        e.preventDefault();
        const el = document.querySelector<HTMLTextAreaElement>('[data-shortcut="note"]');
        el?.focus();
        break;
      }
      case 'w':
      case 'W': {
        e.preventDefault();
        const el = document.querySelector<HTMLElement>('[data-shortcut="water"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
      case 'd':
      case 'D': {
        if (e.shiftKey) {
          e.preventDefault();
          ctx.toggleTheme();
        }
        break;
      }
      default:
        break;
    }
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
