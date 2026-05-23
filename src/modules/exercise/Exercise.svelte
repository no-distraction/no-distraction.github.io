<script lang="ts">
  import { rootStorage } from '$core/storage';
  import { app } from '$app/state.svelte';
  import type { DateKey, EventBus } from '$core/types';

  type Props = { bus: EventBus };
  let { bus }: Props = $props();

  const storage = rootStorage.namespaced('exercise');
  const DONE_KEY = (d: DateKey) => `done:${d}`;

  // Fila serial de escritas — evita "transaction has finished" em cliques rápidos
  let writeQueue: Promise<unknown> = Promise.resolve();
  function queueWrite<T>(work: () => Promise<T>): Promise<T> {
    const next = writeQueue.catch(() => {}).then(work);
    writeQueue = next;
    return next;
  }

  let done = $state(false);

  $effect(() => {
    void load(app.selectedDate);
  });

  $effect(() => {
    const offs = [
      bus.on('data:imported', () => load(app.selectedDate)),
      bus.on('data:cleared', () => {
        done = false;
      }),
    ];
    return () => offs.forEach((o) => o());
  });

  async function load(date: DateKey) {
    done = (await storage.get<boolean>(DONE_KEY(date))) ?? false;
  }

  async function toggle() {
    const next = !done;
    done = next;
    const date = app.selectedDate;
    await queueWrite(() => storage.set(DONE_KEY(date), next));
    bus.emit('exercise:toggled', { date, done: next });
  }
</script>

<section class="sub" data-shortcut="exercise">
  <h3 class="sub-head">Exercícios físicos</h3>
  <div class="row" class:done>
    <div class="label">
      <span class="name">treino de hoje</span>
      <span class="status">{done ? 'feito — bom trabalho' : 'pendente'}</span>
    </div>
    <button
      class="figure-btn"
      class:on={done}
      aria-label="Marcar exercício de hoje como feito"
      aria-pressed={done}
      onclick={toggle}
    >
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <!-- barra -->
        <line x1="8" y1="9" x2="32" y2="9" />
        <!-- anilhas (preenchem quando feito) -->
        <rect x="4.5" y="4.5" width="4" height="9" rx="1.2" fill={done ? 'currentColor' : 'none'} />
        <rect x="31.5" y="4.5" width="4" height="9" rx="1.2" fill={done ? 'currentColor' : 'none'} />
        <!-- braços erguendo a barra -->
        <path d="M13 9.5 L16.5 18" />
        <path d="M27 9.5 L23.5 18" />
        <!-- cabeça -->
        <circle cx="20" cy="15" r="3.1" />
        <!-- ombros -->
        <path d="M16.5 18.2 H23.5" />
        <!-- tronco -->
        <path d="M20 18.2 V27" />
        <!-- pernas em base firme -->
        <path d="M20 27 L15 35.5" />
        <path d="M20 27 L25 35.5" />
      </svg>
    </button>
  </div>
</section>

<style>
  .sub-head {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 15px;
    font-weight: 500;
    color: var(--fg-soft);
    margin-bottom: var(--space-3);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
  }
  .label {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .label .name {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 16px;
    color: var(--fg);
  }
  .label .status {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: var(--tracking-wide);
    color: var(--fg-faint);
  }
  .row.done .label .name,
  .row.done .label .status {
    color: var(--accent-deep);
  }

  .figure-btn {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    color: var(--fg-faint);
    transition: color 160ms ease, transform 120ms ease;
  }
  .figure-btn:hover { color: var(--accent); transform: translateY(-1px); }
  .figure-btn.on { color: var(--accent-deep); }
  .figure-btn svg { width: 100%; height: 100%; }

  @media (max-width: 760px) {
    .figure-btn { width: 46px; height: 46px; }
    .label .name { font-size: 15px; }
  }
</style>
