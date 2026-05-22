<script lang="ts">
  import Panel from '$ui/Panel.svelte';
  import Button from '$ui/Button.svelte';
  import { rootStorage } from '$core/storage';
  import { app } from '$app/state.svelte';
  import { buildPlan, formatMl, type WaterConfig, type WaterPlan, CUP_ML } from './calculate';
  import type { DateKey, EventBus } from '$core/types';

  type Props = { bus: EventBus };
  let { bus }: Props = $props();

  const storage = rootStorage.namespaced('water');
  const CHECKS_KEY = (d: DateKey) => `checks:${d}`;

  // Fila serial de escritas — evita "transaction has finished" em cliques rápidos
  let writeQueue: Promise<unknown> = Promise.resolve();
  function queueWrite<T>(work: () => Promise<T>): Promise<T> {
    const next = writeQueue.catch(() => {}).then(work);
    writeQueue = next;
    return next;
  }

  let config = $state<WaterConfig | null>(null);
  let checks = $state<boolean[]>([]);

  $effect(() => {
    void hydrateConfig();
  });

  $effect(() => {
    void loadChecks(app.selectedDate);
  });

  $effect(() => {
    const offs = [
      bus.on('water:config-changed', () => {
        hydrateConfig().then(() => loadChecks(app.selectedDate));
      }),
      bus.on('data:imported', () => {
        hydrateConfig().then(() => loadChecks(app.selectedDate));
      }),
      bus.on('data:cleared', () => {
        config = null;
        checks = [];
      }),
    ];
    return () => offs.forEach((o) => o());
  });

  async function hydrateConfig() {
    config = (await storage.get<WaterConfig>('config')) ?? null;
  }

  async function loadChecks(date: DateKey) {
    const stored = await storage.get<boolean[]>(CHECKS_KEY(date));
    const currentPlan = config ? buildPlan(config) : null;
    const expectedLen = currentPlan?.totalCups ?? 0;
    if (Array.isArray(stored) && stored.length === expectedLen) {
      checks = [...stored];
    } else {
      checks = new Array(expectedLen).fill(false);
    }
  }

  async function toggle(index: number) {
    const wasChecked = checks[index] ?? false;
    const next = [...checks];
    next[index] = !wasChecked;
    checks = next;
    const date = app.selectedDate;
    await queueWrite(() => storage.set(CHECKS_KEY(date), next));
    bus.emit('water:check-toggled', { date, index, checked: next[index] });

    const filledNow = next.every(Boolean) && next.length > 0;
    if (filledNow && !wasChecked && plan) {
      bus.emit('water:goal-met', { date, ml: plan.goalMl });
    }
  }

  let plan = $derived<WaterPlan | null>(config ? buildPlan(config) : null);
  let drunkMl = $derived(checks.filter(Boolean).length * CUP_ML);
  let pct = $derived(plan ? Math.min(100, Math.round((drunkMl / plan.goalMl) * 100)) : 0);

  function cupRangeForPeriod(periodIdx: number): { start: number; end: number } {
    if (!plan) return { start: 0, end: 0 };
    let start = 0;
    for (let i = 0; i < periodIdx; i += 1) start += plan.periods[i].cups;
    return { start, end: start + plan.periods[periodIdx].cups };
  }

  function openSettings() {
    app.showSettings = true;
  }
</script>

<div data-shortcut="water">
<Panel title="Hidratação">
  {#if !config}
    <div class="nudge">
      <p class="lead">
        Para calcular sua hidratação ideal, precisamos saber seu peso.
      </p>
      <Button variant="inked" onclick={openSettings}>Configurar peso</Button>
      <small class="hint">o cálculo é simples: <em>peso × 35 ml</em>, mais 500 ml por exercícios ou clima quente.</small>
    </div>
  {:else if plan}
    <div class="progress">
      <span class="num"><strong>{formatMl(drunkMl)}</strong><span class="of"> / {formatMl(plan.goalMl)}</span></span>
      <div class="bar" aria-hidden="true"><div class="fill" style:width={`${pct}%`}></div></div>
    </div>

    <table class="schedule">
      <thead>
        <tr>
          <th>período</th>
          <th>objetivo</th>
          <th class="cups">copos</th>
        </tr>
      </thead>
      <tbody>
        {#each plan.periods as p, idx (p.period)}
          {@const range = cupRangeForPeriod(idx)}
          {@const filled = checks.slice(range.start, range.end).filter(Boolean).length}
          <tr class="row" class:done={filled === p.cups && p.cups > 0}>
            <td>
              <div class="period">
                <span class="time">{p.label}</span>
                <span class="share">{Math.round(p.share * 100)}%</span>
              </div>
            </td>
            <td>
              <em>{p.intent}</em>
              <small>{filled}/{p.cups} · {formatMl(filled * CUP_ML)}</small>
            </td>
            <td class="cups">
              <div class="cup-row">
                {#each Array(p.cups) as _, i (i)}
                  {@const ci = range.start + i}
                  <button
                    class="cup"
                    class:on={checks[ci]}
                    aria-label={`${p.label}: copo ${i + 1}`}
                    aria-pressed={checks[ci] ?? false}
                    onclick={() => toggle(ci)}
                  >
                    <svg viewBox="0 0 24 28" aria-hidden="true">
                      <path d="M5 4 h14 l-1.5 20 a2 2 0 0 1 -2 2 h-7 a2 2 0 0 1 -2 -2 z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                      {#if checks[ci]}
                        <path d="M5.5 12 h13 l-1.4 12 a2 2 0 0 1 -2 2 h-6.2 a2 2 0 0 1 -2 -2 z" fill="currentColor" opacity="0.8"/>
                        <path d="M9 6 q3 -2 6 0" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
                      {/if}
                    </svg>
                  </button>
                {/each}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if plan.bonusMl > 0}
      <p class="bonus-note">
        meta inclui <em>+{formatMl(plan.bonusMl)}</em> de extra
        {#if config.exercises && config.hotClimate}(exercícios e clima quente){:else if config.exercises}(exercícios){:else}(clima quente){/if}
      </p>
    {/if}
  {/if}
</Panel>
</div>

<style>
  .nudge {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-3);
  }
  .lead {
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--fg-soft);
    line-height: 1.5;
    max-width: 360px;
  }
  .hint {
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--fg-faint);
    line-height: 1.5;
    max-width: 320px;
  }
  .hint em {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--accent-deep);
  }

  .progress {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: var(--space-4);
  }
  .num {
    font-family: var(--font-display);
    font-size: 14px;
    color: var(--fg-faint);
  }
  .num strong {
    font-weight: 500;
    color: var(--fg);
    font-size: 24px;

    font-feature-settings: 'tnum';
  }
  .num .of { color: var(--fg-faint); }
  .bar {
    height: 4px;
    background: var(--bg-sunk);
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid var(--rule);
  }
  .fill {
    height: 100%;
    background: linear-gradient(to right, var(--accent), var(--accent-deep));
    transition: width 360ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .schedule {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-body);
    font-size: 13px;
  }
  .schedule th {
    text-align: left;
    padding: 6px 8px 6px 0;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: var(--tracking-uppercase);
    text-transform: uppercase;
    color: var(--fg-faint);
    font-weight: 400;
    border-bottom: 1px solid var(--rule);
  }
  .schedule th.cups { text-align: right; }
  .schedule td {
    padding: var(--space-3) 8px var(--space-3) 0;
    vertical-align: middle;
    border-bottom: 1px dotted var(--rule-soft);
  }
  .schedule tr:last-child td { border-bottom: none; }
  .schedule td.cups { text-align: right; padding-right: 0; }

  .period {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .period .time {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 16px;
    color: var(--fg);
  }
  .period .share {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--fg-faint);
    letter-spacing: var(--tracking-wide);
  }
  .row.done .period .time { color: var(--accent-deep); }
  .schedule em {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--fg-soft);
    font-size: 13px;
    display: block;
  }
  .schedule small {
    display: block;
    margin-top: 2px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--fg-faint);
  }

  .cup-row {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 4px;
  }
  .cup {
    width: 22px;
    height: 26px;
    color: var(--fg-faint);
    transition: color 160ms ease, transform 120ms ease;
  }
  .cup:hover { color: var(--accent); transform: translateY(-1px); }
  .cup.on { color: var(--accent-deep); }
  .cup svg { width: 100%; height: 100%; }

  .bonus-note {
    margin-top: var(--space-3);
    padding-top: var(--space-2);
    border-top: 1px dashed var(--rule-soft);
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--fg-faint);
    text-align: center;
  }
  .bonus-note em { color: var(--accent-deep); font-style: italic; }

  @media (max-width: 760px) {
    .cup { width: 28px; height: 32px; }
    .schedule td { padding: var(--space-2) 4px var(--space-2) 0; }
    .period .time { font-size: 15px; }
    .schedule em { font-size: 12px; }
  }
</style>
