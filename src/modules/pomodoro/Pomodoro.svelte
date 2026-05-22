<script lang="ts">
  import Panel from '$ui/Panel.svelte';
  import Button from '$ui/Button.svelte';
  import { rootStorage } from '$core/storage';
  import { pushToast } from '$app/state.svelte';
  import {
    DEFAULT_CONFIG,
    type PomodoroConfig,
    type PomodoroSnapshot,
    defaultSnapshot,
    nextPhase,
    phaseDurationMs,
    progress,
    remainingMs,
  } from './engine';
  import { chime } from './sound';
  import type { EventBus, PomodoroPhase } from '$core/types';

  type Props = { bus: EventBus };
  let { bus }: Props = $props();

  const storage = rootStorage.namespaced('pomodoro');

  let snap = $state<PomodoroSnapshot>(defaultSnapshot());
  let now = $state(Date.now());
  let originalTitle = '';

  $effect(() => {
    if (typeof document !== 'undefined') originalTitle = originalTitle || document.title;
    void hydrate();
    const id = setInterval(() => {
      now = Date.now();
      tickCheck();
      updateTitle();
    }, 250);
    const onVisible = () => {
      now = Date.now();
      tickCheck();
    };
    document.addEventListener('visibilitychange', onVisible);
    const onToggle = () => toggle();
    window.addEventListener('pomodoro:toggle', onToggle);
    const offConfig = bus.on('pomodoro:config-changed', () => {
      void reloadConfig();
    });
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pomodoro:toggle', onToggle);
      offConfig();
      document.title = originalTitle;
    };
  });

  async function reloadConfig() {
    const c = (await storage.get<PomodoroConfig>('config')) ?? DEFAULT_CONFIG;
    snap.config = c;
  }

  async function hydrate() {
    const config = (await storage.get<PomodoroConfig>('config')) ?? DEFAULT_CONFIG;
    const stored = await storage.get<PomodoroSnapshot>('state');
    if (stored) {
      snap = { ...stored, config };
      // se estava rodando antes do refresh, e o tempo expirou, fechamos o ciclo silenciosamente
      if (snap.status === 'running' && remainingMs(snap) <= 0) {
        completePhase(false);
      }
    } else {
      snap = defaultSnapshot(config);
    }
  }

  async function persist() {
    await storage.set('state', snap);
  }

  function start() {
    if (snap.status === 'running') return;
    const t = Date.now();
    if (snap.status === 'paused' && snap.pausedRemainingMs != null) {
      const used = phaseDurationMs(snap) - snap.pausedRemainingMs;
      snap.startedAt = t - used;
      snap.pausedRemainingMs = null;
    } else {
      snap.startedAt = t;
    }
    snap.status = 'running';
    now = t; // sincroniza now com o instante de início pra evitar "+1s" no primeiro tick
    bus.emit('pomodoro:started', { phase: snap.phase });
    void persist();
  }

  function pause() {
    if (snap.status !== 'running') return;
    snap.pausedRemainingMs = remainingMs(snap);
    snap.status = 'paused';
    void persist();
  }

  function reset() {
    snap.status = 'idle';
    snap.startedAt = null;
    snap.pausedRemainingMs = null;
    void persist();
  }

  function toggle() {
    if (snap.status === 'running') pause();
    else start();
  }

  function skip() {
    completePhase(true);
  }

  function completePhase(skipped: boolean) {
    const phase = snap.phase;
    const dur = phaseDurationMs(snap);
    if (!skipped) {
      bus.emit('pomodoro:cycle-completed', { phase, durationMs: dur });
      if (snap.config.soundEnabled) chime();
      pushToast(
        phase === 'focus'
          ? 'foco concluído — respire.'
          : 'pausa encerrada — quando quiser, recomece.',
      );
    }
    const { phase: nextP, completedFocusCount } = nextPhase(snap);
    snap.phase = nextP;
    snap.completedFocusCount = completedFocusCount;
    snap.status = 'idle';
    snap.startedAt = null;
    snap.pausedRemainingMs = null;
    void persist();
  }

  function tickCheck() {
    if (snap.status === 'running' && remainingMs(snap, now) <= 0) {
      completePhase(false);
    }
  }

  function updateTitle() {
    if (typeof document === 'undefined') return;
    if (snap.status === 'running') {
      document.title = `${formatTime(remainingMs(snap, now))} · ${labelForPhase(snap.phase)}`;
    } else if (originalTitle) {
      document.title = originalTitle;
    }
  }

  function formatTime(ms: number): string {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
  }

  function labelForPhase(p: PomodoroPhase): string {
    return p === 'focus' ? 'foco' : p === 'short' ? 'pausa curta' : 'pausa longa';
  }

  // Nunca exibir mais do que a duração total da fase atual (defensiva contra
  // qualquer caminho que pudesse retornar ms > total — clock skew, tick antigo, etc).
  let remaining = $derived(Math.min(phaseDurationMs(snap), remainingMs(snap, now)));
  let prog = $derived(progress(snap, now));
  let circumference = 2 * Math.PI * 70;

</script>

<Panel title="Pomodoro">
  <div class="dial" class:running={snap.status === 'running'}>
    <svg viewBox="0 0 180 180" aria-hidden="true">
      <defs>
        <linearGradient id="phase-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" />
          <stop offset="100%" stop-color="var(--accent-deep)" />
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r="70" fill="none" stroke="var(--rule)" stroke-width="2"></circle>
      <circle
        cx="90" cy="90" r="70"
        fill="none"
        stroke="url(#phase-gradient)"
        stroke-width="3"
        stroke-linecap="round"
        stroke-dasharray={circumference}
        stroke-dashoffset={circumference * (1 - prog)}
        transform="rotate(-90 90 90)"
        style="transition: stroke-dashoffset 240ms ease;"
      ></circle>
      {#each Array(12) as _, i (i)}
        <line
          x1="90" y1="14"
          x2="90" y2={i % 3 === 0 ? 22 : 18}
          stroke="var(--rule)"
          stroke-width="1"
          transform={`rotate(${i * 30} 90 90)`}
        />
      {/each}
    </svg>
    <div class="readout">
      <div class="time">{formatTime(remaining)}</div>
      <div class="phase">{labelForPhase(snap.phase)}</div>
    </div>
  </div>

  <div class="controls">
    {#if snap.status === 'running'}
      <Button variant="inked" onclick={pause}>Pausar</Button>
    {:else}
      <Button variant="inked" onclick={start}>{snap.status === 'paused' ? 'Retomar' : 'Iniciar'}</Button>
    {/if}
    <Button variant="pressed" onclick={skip} title="Pular para a próxima fase">Pular</Button>
    <Button variant="ghost" onclick={reset} title="Resetar ciclo atual">Resetar</Button>
  </div>
</Panel>

<style>
  .dial {
    /* Base (mobile/tablet): o painel cresce com o conteúdo, então o disco
       é dimensionado pela largura e mantém o tamanho cheio. O modo "encolher
       por altura" fica restrito ao desktop (ver @media min-width: 1101px),
       onde a coluna da direita tem altura travada. */
    position: relative;
    width: 100%;
    max-width: 240px;
    aspect-ratio: 1 / 1;
    align-self: center;
    margin: var(--space-2) auto var(--space-3);
    display: flex;
    align-items: center;
    justify-content: center;
    /* O disco é o container de referência do relógio: o número e a fase
       escalam pelo seu tamanho (cqmin), então encolhem junto quando a
       altura aperta, em vez de estourar/sumir. */
    container-type: size;
  }
  .dial svg {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
  }
  .readout {
    position: relative;
    text-align: center;
    z-index: 1;
  }
  .time {
    font-family: var(--font-mono);
    /* ~18.5% do menor lado do disco, limitado entre 18px e 44px */
    font-size: clamp(18px, 18.5cqmin, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--fg);
    line-height: 1;
    font-feature-settings: 'tnum', 'lnum';
  }
  .phase {
    margin-top: 6px;
    font-family: var(--font-display);
    font-style: italic;
    font-size: clamp(10px, 6cqmin, 14px);
    color: var(--fg-faint);
    letter-spacing: 0.04em;
  }
  .dial.running .time { color: var(--accent-deep); }
  :global([data-theme='dark']) .dial.running .time { color: var(--sage-deep); }

  .controls {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
    flex-wrap: wrap;
    /* os botões mantêm sua altura mesmo quando o painel fica curto */
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .dial { max-width: 200px; }
    .time { font-size: 38px; }
  }

  /* Só na coluna fixa do desktop o painel tem altura travada
     (.right-fixed: height: calc(100vh ...) + overflow: hidden). Aí o disco
     passa a flexionar pela altura e encolher conforme o painel aperta, pra
     nunca empurrar os controles pra fora da área recortada. min-*: 0 removem
     o piso de tamanho do conteúdo; a largura segue da altura via aspect-ratio. */
  @media (min-width: 1101px) {
    .dial {
      flex: 1 1 auto;
      width: auto;
      max-width: none;
      min-height: 0;
      min-width: 0;
      max-height: 240px;
    }
  }
</style>
