/**
 * Sinal sonoro mínimo via WebAudio. Não carrega áudio externo.
 * Soa como dois tons curtos, calmos.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const W = window as unknown as { webkitAudioContext?: typeof AudioContext };
  const Ctx = window.AudioContext || W.webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function chime(): void {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  const tones = [
    { freq: 660, start: 0,   dur: 0.32, gain: 0.10 },
    { freq: 880, start: 0.18, dur: 0.42, gain: 0.08 },
  ];
  for (const t of tones) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = t.freq;
    g.gain.setValueAtTime(0, now + t.start);
    g.gain.linearRampToValueAtTime(t.gain, now + t.start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.dur);
    osc.connect(g).connect(audio.destination);
    osc.start(now + t.start);
    osc.stop(now + t.start + t.dur + 0.02);
  }
}
