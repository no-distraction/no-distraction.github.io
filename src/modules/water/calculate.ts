/**
 * Hidratação:
 *   meta base (ml) = peso (kg) × 35
 *   + 500 ml se pratica exercícios físicos regularmente
 *   + 500 ml se mora em clima muito quente
 *
 * Reparto recomendado:
 *   30% manhã  — despertar o metabolismo
 *   50% tarde  — manter foco e energia
 *   20% noite  — hidratação leve pré-sono
 *
 * O total é fatiado em copos de 250 ml (arredondado para cima, pois meio-copo é
 * inconveniente para checar). Cada período recebe um número inteiro de copos
 * conforme a proporção, com sobra atribuída à tarde (a maior faixa).
 */

export const ML_PER_KG = 35;
export const EXERCISE_BONUS_ML = 500;
export const HOT_CLIMATE_BONUS_ML = 500;
export const CUP_ML = 250;

export type WaterConfig = {
  weightKg: number;
  exercises: boolean;
  hotClimate: boolean;
};

export type Period = 'morning' | 'afternoon' | 'evening';

export type PeriodPlan = {
  period: Period;
  label: string;
  intent: string;
  share: number;        // proporção da meta (0..1)
  cups: number;         // copos atribuídos
  ml: number;           // mililitros somando os copos
};

export type WaterPlan = {
  weightKg: number;
  baseMl: number;
  bonusMl: number;
  goalMl: number;
  totalCups: number;
  periods: PeriodPlan[];
};

export function totalGoalMl(config: WaterConfig): number {
  const base = Math.round(config.weightKg * ML_PER_KG);
  const bonus = (config.exercises ? EXERCISE_BONUS_ML : 0) + (config.hotClimate ? HOT_CLIMATE_BONUS_ML : 0);
  return base + bonus;
}

export function buildPlan(config: WaterConfig): WaterPlan {
  const baseMl = Math.round(config.weightKg * ML_PER_KG);
  const bonusMl = (config.exercises ? EXERCISE_BONUS_ML : 0) + (config.hotClimate ? HOT_CLIMATE_BONUS_ML : 0);
  const goalMl = baseMl + bonusMl;
  const totalCups = Math.max(1, Math.ceil(goalMl / CUP_ML));

  // copos inteiros por período; sobra vai para a tarde
  const morning = Math.round(totalCups * 0.30);
  const evening = Math.round(totalCups * 0.20);
  const afternoon = Math.max(0, totalCups - morning - evening);

  const periods: PeriodPlan[] = [
    { period: 'morning',   label: 'manhã',  intent: 'despertar o metabolismo',     share: 0.30, cups: morning,   ml: morning * CUP_ML },
    { period: 'afternoon', label: 'tarde',  intent: 'manter foco e energia',       share: 0.50, cups: afternoon, ml: afternoon * CUP_ML },
    { period: 'evening',   label: 'noite',  intent: 'hidratação leve pré-sono',    share: 0.20, cups: evening,   ml: evening * CUP_ML },
  ];

  return { weightKg: config.weightKg, baseMl, bonusMl, goalMl, totalCups, periods };
}

export function formatMl(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1).replace('.', ',')} L`;
  return `${ml} ml`;
}
