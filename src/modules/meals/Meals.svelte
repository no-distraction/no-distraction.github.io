<script lang="ts">
  import { rootStorage } from '$core/storage';
  import { app } from '$app/state.svelte';
  import { MEALS, emptyMeals, mealProgress, type MealId, type MealMap } from './meals';
  import type { DateKey, EventBus } from '$core/types';

  type Props = { bus: EventBus };
  let { bus }: Props = $props();

  const storage = rootStorage.namespaced('meals');
  const EATEN_KEY = (d: DateKey) => `eaten:${d}`;

  // Fila serial de escritas — evita "transaction has finished" em cliques rápidos
  let writeQueue: Promise<unknown> = Promise.resolve();
  function queueWrite<T>(work: () => Promise<T>): Promise<T> {
    const next = writeQueue.catch(() => {}).then(work);
    writeQueue = next;
    return next;
  }

  let eaten = $state<MealMap>(emptyMeals());

  $effect(() => {
    void loadEaten(app.selectedDate);
  });

  $effect(() => {
    const offs = [
      bus.on('data:imported', () => loadEaten(app.selectedDate)),
      bus.on('data:cleared', () => {
        eaten = emptyMeals();
      }),
    ];
    return () => offs.forEach((o) => o());
  });

  async function loadEaten(date: DateKey) {
    const stored = await storage.get<Partial<MealMap>>(EATEN_KEY(date));
    eaten = stored ? { ...emptyMeals(), ...stored } : emptyMeals();
  }

  async function toggle(id: MealId) {
    const was = eaten[id];
    const next: MealMap = { ...eaten, [id]: !was };
    eaten = next;
    const date = app.selectedDate;
    await queueWrite(() => storage.set(EATEN_KEY(date), next));
    bus.emit('meals:check-toggled', { date, meal: id, checked: next[id] });

    if (!was && MEALS.every((m) => next[m.id])) {
      bus.emit('meals:all-done', { date });
    }
  }

  let progress = $derived(mealProgress(eaten));
</script>

<section class="sub" data-shortcut="meals">
  <h3 class="sub-head">Alimentação</h3>
  <div class="progress">
    <span class="num"><strong>{progress.done}</strong><span class="of"> / {progress.total} refeições</span></span>
    <div class="bar" aria-hidden="true"><div class="fill" style:width={`${progress.pct}%`}></div></div>
  </div>

  <table class="schedule">
    <thead>
      <tr>
        <th>refeição</th>
        <th>objetivo</th>
        <th class="plate-col">prato</th>
      </tr>
    </thead>
    <tbody>
      {#each MEALS as meal (meal.id)}
        <tr class="row" class:done={eaten[meal.id]}>
          <td>
            <div class="meal">
              <span class="name">{meal.label}</span>
              <span class="time">{meal.time}</span>
            </div>
          </td>
          <td>
            <em>{meal.intent}</em>
            <small>{eaten[meal.id] ? 'feito' : 'pendente'}</small>
          </td>
          <td class="plate-col">
            <button
              class="plate"
              class:on={eaten[meal.id]}
              aria-label={`${meal.label}: marcar como feito`}
              aria-pressed={eaten[meal.id]}
              onclick={() => toggle(meal.id)}
            >
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <!-- garfo -->
                <path d="M6.5 4 V8.5" />
                <path d="M9.5 4 V8.5" />
                <path d="M8 8.5 V28" />
                <!-- faca -->
                <path d="M25.5 4 C23.6 6 23.6 8.6 25.5 10.6 V28" />
                <!-- prato -->
                <circle cx="16.5" cy="17" r="6.8" />
                <circle cx="16.5" cy="17" r="3.6" fill={eaten[meal.id] ? 'currentColor' : 'none'} opacity={eaten[meal.id] ? 0.85 : 0.5} />
              </svg>
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
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
    table-layout: fixed;
    border-collapse: collapse;
    font-family: var(--font-body);
    font-size: 13px;
  }
  /* Larguras fixas iguais às da tabela de Hidratação — mantêm a coluna
     OBJETIVO começando no mesmo x nas duas subseções. */
  .schedule th:first-child { width: 30%; }
  .schedule th:last-child { width: 28%; }
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
  .schedule th.plate-col { text-align: right; }
  .schedule td {
    padding: var(--space-3) 8px var(--space-3) 0;
    vertical-align: middle;
    border-bottom: 1px dotted var(--rule-soft);
  }
  .schedule tr:last-child td { border-bottom: none; }
  .schedule td.plate-col { text-align: right; padding-right: 0; }

  .meal {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .meal .name {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 16px;
    color: var(--fg);
  }
  .meal .time {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--fg-faint);
    letter-spacing: var(--tracking-wide);
  }
  .row.done .meal .name { color: var(--accent-deep); }
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
  .row.done small { color: var(--accent-deep); }

  .plate {
    width: 30px;
    height: 30px;
    color: var(--fg-faint);
    transition: color 160ms ease, transform 120ms ease;
  }
  .plate:hover { color: var(--accent); transform: translateY(-1px); }
  .plate.on { color: var(--accent-deep); }
  .plate svg { width: 100%; height: 100%; }

  @media (max-width: 760px) {
    .plate { width: 36px; height: 36px; }
    .schedule td { padding: var(--space-2) 4px var(--space-2) 0; }
    .meal .name { font-size: 15px; }
    .schedule em { font-size: 12px; }
  }
</style>
