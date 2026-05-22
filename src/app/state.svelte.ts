/*
 * Estado global compartilhado pelo shell e módulos.
 * Usa runes do Svelte 5 para reatividade fina.
 */
import { todayKey } from '$core/date';
import type { DateKey, Theme } from '$core/types';

export type IndicatorMap = Record<DateKey, { tasks: number; pending: number; note: boolean }>;

export const app = $state({
  ready: false,
  selectedDate: todayKey() as DateKey,
  visibleMonth: todayKey() as DateKey,
  theme: 'light' as Theme,
  showSettings: false,
  showShortcuts: false,
  toast: null as { id: number; text: string; tone?: 'info' | 'danger' } | null,
  indicators: {} as IndicatorMap,
});

let toastId = 0;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function pushToast(text: string, tone: 'info' | 'danger' = 'info', ms = 2200) {
  toastId += 1;
  app.toast = { id: toastId, text, tone };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    app.toast = null;
  }, ms);
}

export function setIndicator(date: DateKey, partial: Partial<IndicatorMap[string]>) {
  const prev = app.indicators[date] ?? { tasks: 0, pending: 0, note: false };
  const next = { ...prev, ...partial };
  if (next.tasks === 0 && !next.note) {
    const copy = { ...app.indicators };
    delete copy[date];
    app.indicators = copy;
  } else {
    app.indicators = { ...app.indicators, [date]: next };
  }
}
