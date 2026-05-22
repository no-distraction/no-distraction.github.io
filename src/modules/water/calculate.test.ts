import { describe, expect, it } from 'vitest';
import { buildPlan, totalGoalMl, formatMl, CUP_ML } from './calculate';

describe('water plan', () => {
  it('70 kg sem extras → 2450 ml ≈ 10 copos', () => {
    const plan = buildPlan({ weightKg: 70, exercises: false, hotClimate: false });
    expect(plan.goalMl).toBe(2450);
    expect(plan.totalCups).toBe(10);
    const cupsSum = plan.periods.reduce((s, p) => s + p.cups, 0);
    expect(cupsSum).toBe(10);
  });

  it('70 kg com exercício e calor → +1000 ml', () => {
    expect(totalGoalMl({ weightKg: 70, exercises: true, hotClimate: true })).toBe(3450);
  });

  it('manhã = 30%, tarde = 50%, noite = 20% (aproximado)', () => {
    const plan = buildPlan({ weightKg: 80, exercises: false, hotClimate: false });
    const total = plan.totalCups;
    const morning = plan.periods[0].cups;
    const afternoon = plan.periods[1].cups;
    const evening = plan.periods[2].cups;
    expect(morning / total).toBeCloseTo(0.3, 1);
    expect(afternoon / total).toBeCloseTo(0.5, 1);
    expect(evening / total).toBeCloseTo(0.2, 1);
  });

  it('totalCups * CUP_ML deve cobrir a meta', () => {
    for (const w of [45, 60, 72, 90, 110]) {
      const plan = buildPlan({ weightKg: w, exercises: false, hotClimate: false });
      expect(plan.totalCups * CUP_ML).toBeGreaterThanOrEqual(plan.goalMl);
    }
  });

  it('formatMl mostra litros quando >= 1000', () => {
    expect(formatMl(750)).toBe('750 ml');
    expect(formatMl(1000)).toBe('1 L');
    expect(formatMl(2450)).toBe('2,5 L');
  });
});
