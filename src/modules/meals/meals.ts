/**
 * Alimentação: checklist diário simples das três refeições principais.
 * Sem cálculo por peso (diferente da hidratação) — a meta é fixa: comer
 * as três. Cada refeição é um "prato" que se marca ao concluir.
 */

export type MealId = 'breakfast' | 'lunch' | 'dinner';

export type Meal = {
  id: MealId;
  label: string;
  time: string;
  intent: string;
};

export const MEALS: readonly Meal[] = [
  { id: 'breakfast', label: 'café da manhã', time: 'manhã', intent: 'comece o dia com energia' },
  { id: 'lunch', label: 'almoço', time: 'tarde', intent: 'refeição principal do dia' },
  { id: 'dinner', label: 'janta', time: 'noite', intent: 'leve, antes de dormir' },
];

export type MealMap = Record<MealId, boolean>;

export function emptyMeals(): MealMap {
  return { breakfast: false, lunch: false, dinner: false };
}

export function mealProgress(eaten: MealMap): { done: number; total: number; pct: number } {
  const total = MEALS.length;
  const done = MEALS.reduce((n, m) => n + (eaten[m.id] ? 1 : 0), 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
