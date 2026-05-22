<script lang="ts">
  import Panel from '$ui/Panel.svelte';
  import { formatMonthYear, fromDateKey, monthMatrix, todayKey, toDateKey } from '$core/date';
  import { app } from '$app/state.svelte';
  import type { EventBus, DateKey } from '$core/types';

  type Props = { bus: EventBus };
  let { bus }: Props = $props();

  let today = $state(todayKey());

  // Mantém `today` sempre atualizado: ao voltar de background, ao ganhar
  // foco, e periodicamente (cobre virada de meia-noite com o app aberto).
  $effect(() => {
    const refresh = () => {
      const t = todayKey();
      if (t !== today) today = t;
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    const id = setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      clearInterval(id);
    };
  });

  // Quando a data selecionada muda (ex.: ← → no teclado, clique em outro
  // mês), o calendário acompanha. NÃO lemos visibleMonth aqui para evitar
  // que o effect se re-dispare ao usar as setas de navegação do mês.
  $effect(() => {
    const sel = fromDateKey(app.selectedDate);
    const first = new Date(sel.getFullYear(), sel.getMonth(), 1);
    app.visibleMonth = toDateKey(first);
  });

  let cells = $derived(monthMatrix(app.visibleMonth));
  let monthIndex = $derived(fromDateKey(app.visibleMonth).getMonth());

  function isCurrentMonth(key: DateKey) {
    return fromDateKey(key).getMonth() === monthIndex;
  }

  function select(date: DateKey) {
    app.selectedDate = date;
    bus.emit('day:selected', { date });
  }

  function shiftMonth(delta: number) {
    const d = fromDateKey(app.visibleMonth);
    d.setMonth(d.getMonth() + delta, 1);
    app.visibleMonth = toDateKey(d);
  }

  const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const weekdaysFull = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
</script>

<Panel title={formatMonthYear(app.visibleMonth)}>
  {#snippet actions()}
    <div class="nav-row">
      <button class="nav" aria-label="Mês anterior" onclick={() => shiftMonth(-1)}>‹</button>
      {#if app.selectedDate === today}
        <span class="today-indicator" aria-label="você está em hoje">hoje</span>
      {/if}
      <button class="nav" aria-label="Próximo mês" onclick={() => shiftMonth(1)}>›</button>
    </div>
  {/snippet}

  <div class="grid" role="grid">
    {#each weekdays as wd, i (i)}
      <div class="dow" role="columnheader" aria-label={weekdaysFull[i]}>{wd}</div>
    {/each}
    {#each cells as cell (cell)}
      {@const dim = !isCurrentMonth(cell)}
      {@const isToday = cell === today}
      {@const isSel = cell === app.selectedDate}
      {@const ind = app.indicators[cell]}
      {@const day = fromDateKey(cell).getDate()}
      <button
        class="cell"
        class:dim
        class:today={isToday}
        class:selected={isSel}
        role="gridcell"
        aria-selected={isSel}
        aria-label={`${day}, ${weekdaysFull[fromDateKey(cell).getDay()]}`}
        onclick={() => select(cell)}
      >
        <span class="num">{day}</span>
        {#if ind}
          <span class="dots" aria-hidden="true">
            {#if ind.pending > 0}<span class="dot pending" title={`${ind.pending} pendente(s)`}></span>{/if}
            {#if ind.tasks > 0 && ind.pending === 0}<span class="dot done" title="tudo feito"></span>{/if}
            {#if ind.note}<span class="dot note" title="há uma nota"></span>{/if}
          </span>
        {/if}
      </button>
    {/each}
  </div>
</Panel>

<style>
  .nav-row { display: inline-flex; gap: 2px; align-items: center; }
  .nav {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--fg-soft);
    width: 24px;
    height: 24px;
    border-radius: 999px;
    border: 1px solid transparent;
    transition: background 140ms ease, border-color 140ms ease;
  }
  .nav:hover { background: var(--bg-elev); border-color: var(--rule); }
  .today-indicator {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: var(--tracking-uppercase);
    color: var(--accent-deep);
    padding: 0 10px;
    user-select: none;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: auto repeat(6, 1fr);
    gap: 1px;
    background: var(--rule);
    border: 1px solid var(--rule);
    border-radius: var(--r-2);
    overflow: hidden;
    flex: 1;
    min-height: 0;
  }
  .dow {
    text-align: center;
    padding: 4px 0;
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: var(--tracking-uppercase);
    text-transform: uppercase;
    color: var(--fg-faint);
    background: var(--bg);
  }
  .cell {
    background: var(--bg);
    padding: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    position: relative;
    transition: background 140ms ease, color 140ms ease;
    min-height: 0;
  }
  .cell:hover { background: var(--bg-elev); }
  .cell.dim { color: var(--fg-ghost); }
  .cell.dim:hover { background: var(--bg-sunk); }
  .num {
    font-family: var(--font-display);

    font-size: 12px;
    line-height: 1;
  }
  .cell.today {
    background: color-mix(in oklab, var(--honey) 18%, var(--bg));
  }
  .cell.today .num { font-weight: 500; }
  .cell.selected {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    z-index: 1;
  }

  .dots {
    display: flex;
    gap: 2px;
    position: absolute;
    bottom: 2px;
  }
  .dot {
    width: 3px; height: 3px;
    border-radius: 999px;
  }
  .dot.pending { background: var(--terra); }
  .dot.done    { background: var(--accent); }
  .dot.note    { background: var(--bloom); }

  @media (max-width: 760px) {
    .nav { width: 32px; height: 32px; font-size: 16px; }
    .today-indicator { font-size: 11px; padding: 0 12px; }
    .dow { padding: 6px 0; font-size: 10px; }
    .cell { min-height: 38px; }
    .num { font-size: 14px; }
  }
</style>
