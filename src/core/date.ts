import type { DateKey } from './types';

const pad = (n: number) => n.toString().padStart(2, '0');

export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

function startOfMonth(key: DateKey): DateKey {
  const d = fromDateKey(key);
  d.setDate(1);
  return toDateKey(d);
}

export function monthMatrix(key: DateKey): DateKey[] {
  const first = fromDateKey(startOfMonth(key));
  const firstDow = first.getDay();
  const start = new Date(first);
  start.setDate(first.getDate() - firstDow);
  const cells: DateKey[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(toDateKey(d));
  }
  return cells;
}

const MONTH_NAMES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function formatLong(key: DateKey): string {
  const d = fromDateKey(key);
  return `${d.getDate()} de ${MONTH_NAMES_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatMonthYear(key: DateKey): string {
  const d = fromDateKey(key);
  return `${MONTH_NAMES_PT[d.getMonth()]} · ${d.getFullYear()}`;
}
