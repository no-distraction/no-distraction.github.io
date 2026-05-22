import type { PomodoroPhase } from '$core/types';

export type PomodoroConfig = {
  focusMin: number;
  shortMin: number;
  longMin: number;
  cyclesUntilLong: number;
  soundEnabled: boolean;
};

export const DEFAULT_CONFIG: PomodoroConfig = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  cyclesUntilLong: 4,
  soundEnabled: true,
};

export type PomodoroSnapshot = {
  phase: PomodoroPhase;
  status: 'idle' | 'running' | 'paused';
  startedAt: number | null;
  pausedRemainingMs: number | null;
  completedFocusCount: number;
  config: PomodoroConfig;
};

export function defaultSnapshot(config = DEFAULT_CONFIG): PomodoroSnapshot {
  return {
    phase: 'focus',
    status: 'idle',
    startedAt: null,
    pausedRemainingMs: null,
    completedFocusCount: 0,
    config,
  };
}

export function phaseDurationMs(snap: PomodoroSnapshot): number {
  const c = snap.config;
  if (snap.phase === 'focus') return c.focusMin * 60_000;
  if (snap.phase === 'short') return c.shortMin * 60_000;
  return c.longMin * 60_000;
}

export function remainingMs(snap: PomodoroSnapshot, now: number = Date.now()): number {
  if (snap.status === 'idle') return phaseDurationMs(snap);
  if (snap.status === 'paused') return snap.pausedRemainingMs ?? phaseDurationMs(snap);
  if (snap.status === 'running' && snap.startedAt != null) {
    // Se `now` chegar atrasado em relação a `startedAt` (clock skew, tick antigo),
    // elapsed seria negativo e o remanescente passaria do total. Clampamos.
    const elapsed = Math.max(0, now - snap.startedAt);
    return Math.max(0, phaseDurationMs(snap) - elapsed);
  }
  return phaseDurationMs(snap);
}

export function progress(snap: PomodoroSnapshot, now: number = Date.now()): number {
  const total = phaseDurationMs(snap);
  return total === 0 ? 0 : 1 - remainingMs(snap, now) / total;
}

export function nextPhase(snap: PomodoroSnapshot): { phase: PomodoroPhase; completedFocusCount: number } {
  if (snap.phase === 'focus') {
    const next = snap.completedFocusCount + 1;
    if (next % snap.config.cyclesUntilLong === 0) {
      return { phase: 'long', completedFocusCount: next };
    }
    return { phase: 'short', completedFocusCount: next };
  }
  return { phase: 'focus', completedFocusCount: snap.completedFocusCount };
}
