import { describe, expect, it } from 'vitest';
import { defaultSnapshot, nextPhase, remainingMs, progress, phaseDurationMs } from './engine';

describe('pomodoro engine', () => {
  it('starts idle on focus phase with full duration remaining', () => {
    const s = defaultSnapshot();
    expect(s.phase).toBe('focus');
    expect(remainingMs(s)).toBe(phaseDurationMs(s));
    expect(progress(s)).toBe(0);
  });

  it('advances focus → short → focus → … → long every cyclesUntilLong', () => {
    let s = defaultSnapshot();
    const sequence: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      const next = nextPhase(s);
      sequence.push(next.phase);
      s = { ...s, phase: next.phase, completedFocusCount: next.completedFocusCount };
    }
    expect(sequence).toEqual([
      'short', 'focus', 'short', 'focus',
      'short', 'focus', 'long',  'focus',
    ]);
  });

  it('computes remaining via timestamp diff', () => {
    const s = defaultSnapshot();
    const running = { ...s, status: 'running' as const, startedAt: Date.now() - 60_000 };
    const r = remainingMs(running);
    const expected = phaseDurationMs(s) - 60_000;
    expect(Math.abs(r - expected)).toBeLessThan(50);
  });

  it('treats paused as frozen remaining', () => {
    const s = defaultSnapshot();
    const paused = { ...s, status: 'paused' as const, pausedRemainingMs: 5_000 };
    expect(remainingMs(paused)).toBe(5_000);
  });

  it('clamps when now is stale (would otherwise add fake seconds)', () => {
    const s = defaultSnapshot();
    const startedAt = Date.now();
    const staleNow = startedAt - 200; // simula tick antigo
    const running = { ...s, status: 'running' as const, startedAt };
    const r = remainingMs(running, staleNow);
    // não pode passar do total
    expect(r).toBeLessThanOrEqual(phaseDurationMs(s));
    expect(r).toBe(phaseDurationMs(s));
  });
});
