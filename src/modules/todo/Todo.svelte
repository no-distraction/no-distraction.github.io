<script lang="ts">
  import Panel from '$ui/Panel.svelte';
  import { rootStorage } from '$core/storage';
  import { app } from '$app/state.svelte';
  import { TodoStore, type Task } from './store';
  import type { DateKey, EventBus } from '$core/types';

  type Props = { bus: EventBus };
  let { bus }: Props = $props();

  const store = new TodoStore(rootStorage.namespaced('todo'));

  type View = 'day' | 'pending' | 'done';
  let view = $state<View>('day');
  let dayTasks = $state<Task[]>([]);
  let draft = $state('');
  let editing = $state<string | null>(null);
  let editText = $state('');

  // Pendentes e feitas são recortes do dia selecionado — nunca somam outros dias.
  let pendingDay = $derived(dayTasks.filter((t) => !t.done));
  let completedDay = $derived(dayTasks.filter((t) => t.done));

  // Reordenação manual via arrastar (drag and drop).
  let dragId = $state<string | null>(null);
  let overId = $state<string | null>(null);

  $effect(() => {
    loadDay(app.selectedDate);
  });

  $effect(() => {
    const offs = [
      bus.on('data:imported', () => loadDay(app.selectedDate)),
      bus.on('data:cleared', () => {
        dayTasks = [];
      }),
    ];
    return () => offs.forEach((o) => o());
  });

  async function loadDay(date: DateKey) {
    try {
      dayTasks = await store.listByDay(date);
    } catch (err) {
      console.error('[todo] loadDay failed', err);
      dayTasks = [];
    }
  }

  function emitCount(date: DateKey, tasks: Task[]) {
    const total = tasks.length;
    const pendingCount = tasks.filter((t) => !t.done).length;
    bus.emit('task:count-changed', { date, total, pending: pendingCount });
  }

  async function commitDay(date: DateKey, next: Task[]) {
    dayTasks = next;
    await store.write(date, next);
    emitCount(date, next);
  }

  async function add() {
    const text = draft.trim();
    if (!text) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: Date.now(),
    };
    const next = [...dayTasks, task];
    // limpa o input ANTES do await para feedback visual imediato
    draft = '';
    dayTasks = next;
    bus.emit('task:created', { date: app.selectedDate, id: task.id });
    await store.write(app.selectedDate, next);
    emitCount(app.selectedDate, next);
  }

  async function toggle(t: Task) {
    const isNowDone = !t.done;
    const updated: Task = {
      ...t,
      done: isNowDone,
      completedAt: isNowDone ? Date.now() : undefined,
    };
    const next = dayTasks.map((x) => (x.id === t.id ? updated : x));
    await commitDay(app.selectedDate, next);
    bus.emit(isNowDone ? 'task:completed' : 'task:uncompleted', { date: app.selectedDate, id: t.id });
  }

  async function remove(t: Task) {
    const next = dayTasks.filter((x) => x.id !== t.id);
    await commitDay(app.selectedDate, next);
    bus.emit('task:deleted', { date: app.selectedDate, id: t.id });
  }

  function startEdit(t: Task) {
    editing = t.id;
    editText = t.text;
  }
  async function commitEdit(t: Task) {
    const text = editText.trim();
    if (!text) {
      await remove(t);
    } else {
      const next = dayTasks.map((x) => (x.id === t.id ? { ...x, text } : x));
      await commitDay(app.selectedDate, next);
    }
    editing = null;
  }

  function onDragStart(e: DragEvent, t: Task) {
    if (editing === t.id) return;
    dragId = t.id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', t.id);
    }
  }
  function onDragOver(e: DragEvent, t: Task) {
    if (dragId === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    overId = t.id;
  }
  async function onDrop(e: DragEvent, target: Task) {
    e.preventDefault();
    const from = dragId;
    resetDrag();
    if (from === null || from === target.id) return;
    const fromIdx = dayTasks.findIndex((x) => x.id === from);
    const toIdx = dayTasks.findIndex((x) => x.id === target.id);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...dayTasks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await commitDay(app.selectedDate, next);
  }
  function resetDrag() {
    dragId = null;
    overId = null;
  }

  // Reordenação por botões (mobile, onde o arrastar nativo não funciona no toque).
  async function move(t: Task, delta: number) {
    const idx = dayTasks.findIndex((x) => x.id === t.id);
    const target = idx + delta;
    if (idx === -1 || target < 0 || target >= dayTasks.length) return;
    const next = [...dayTasks];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    await commitDay(app.selectedDate, next);
  }

  function setView(v: View) {
    view = v;
  }
</script>

<Panel title="Tarefas">
  {#snippet actions()}
    <div class="seg">
      <button class:on={view === 'day'} onclick={() => setView('day')}>atual</button>
      <button class:on={view === 'pending'} onclick={() => setView('pending')}>pendentes</button>
      <button class:on={view === 'done'} onclick={() => setView('done')}>feitas</button>
    </div>
  {/snippet}

  {#if view === 'day'}
    <form class="new" onsubmit={(e) => { e.preventDefault(); add(); }}>
      <input
        data-shortcut="new-task"
        type="text"
        placeholder="o que merece sua atenção hoje?"
        bind:value={draft}
        maxlength="280"
      />
      <button type="submit" class="add-btn" aria-label="Adicionar tarefa" disabled={!draft.trim()}>+</button>
    </form>

    <ul class="list">
      {#each dayTasks as t, i (t.id)}
        <li
          class="row"
          class:done={t.done}
          class:dragging={dragId === t.id}
          class:drag-over={overId === t.id && dragId !== t.id}
          draggable={editing !== t.id}
          ondragstart={(e) => onDragStart(e, t)}
          ondragover={(e) => onDragOver(e, t)}
          ondrop={(e) => onDrop(e, t)}
          ondragend={resetDrag}
        >
          <span class="grip" aria-hidden="true" title="arraste para reordenar">⠿</span>
          <div class="move">
            <button
              class="move-btn"
              aria-label="Mover para cima"
              disabled={i === 0}
              onclick={() => move(t, -1)}
            >↑</button>
            <button
              class="move-btn"
              aria-label="Mover para baixo"
              disabled={i === dayTasks.length - 1}
              onclick={() => move(t, 1)}
            >↓</button>
          </div>
          <button
            class="check"
            role="checkbox"
            aria-checked={t.done}
            aria-label={t.done ? 'Desmarcar' : 'Concluir'}
            onclick={() => toggle(t)}
          >
            {#if t.done}<span class="tick">✓</span>{/if}
          </button>

          {#if editing === t.id}
            <input
              class="edit"
              bind:value={editText}
              onblur={() => commitEdit(t)}
              onkeydown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitEdit(t); }
                if (e.key === 'Escape') { e.preventDefault(); commitEdit(t); }
              }}
            />
          {:else}
            <span
              class="text"
              role="button"
              tabindex="0"
              title="duplo clique para editar"
              ondblclick={() => startEdit(t)}
              onkeydown={(e) => e.key === 'Enter' && startEdit(t)}
            >{t.text}</span>
          {/if}

          <button class="trash" aria-label="Excluir tarefa" onclick={() => remove(t)}>×</button>
        </li>
      {:else}
        <li class="empty">
          <p>Página em branco.</p>
          <small>Escreva algo acima.</small>
        </li>
      {/each}
    </ul>
  {:else if view === 'pending'}
    <ul class="list">
      {#each pendingDay as t (t.id)}
        <li class="row pending-only">
          <span class="text">{t.text}</span>
        </li>
      {:else}
        <li class="empty"><p>Nada pendente.</p><small>Que sorte.</small></li>
      {/each}
    </ul>
  {:else}
    <ul class="list">
      {#each completedDay as t (t.id)}
        <li class="row pending-only done">
          <span class="text">{t.text}</span>
        </li>
      {:else}
        <li class="empty"><p>Ainda nada concluído.</p></li>
      {/each}
    </ul>
  {/if}
</Panel>

<style>
  .seg {
    display: inline-flex;
    gap: 0;
    border: 1px solid var(--rule);
    border-radius: var(--r-2);
    overflow: hidden;
  }
  .seg button {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: var(--tracking-uppercase);
    text-transform: uppercase;
    padding: 5px 8px;
    color: var(--fg-faint);
    background: var(--bg);
    border-right: 1px solid var(--rule);
  }
  .seg button:last-child { border-right: none; }
  .seg button.on { background: var(--ink); color: var(--bg); }

  .new {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-3) 0;
    border-bottom: 1px dashed var(--rule);
  }
  .new input {
    font-family: var(--font-body);
    font-size: 15px;
    color: var(--fg);
    width: 100%;
    padding: 6px 2px;
  }
  .new input::placeholder { color: var(--fg-ghost); font-style: italic; }
  .add-btn {
    font-family: var(--font-display);
    font-size: 22px;
    line-height: 1;
    color: var(--fg-faint);
    width: 28px;
    height: 28px;
    border-radius: 999px;
  }
  .add-btn:not(:disabled):hover { color: var(--ink); background: var(--bg-elev); }
  .add-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .list {
    list-style: none;
    padding: 0;
    margin: var(--space-3) 0 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .row {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    align-items: center;
    gap: var(--space-3);
    padding: 8px 0;
    border-bottom: 1px dotted var(--rule-soft);
  }
  .row:last-child { border-bottom: none; }
  .row.dragging { opacity: 0.4; }
  .row.drag-over {
    box-shadow: inset 0 2px 0 var(--accent);
  }

  .grip {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1;
    color: var(--fg-ghost);
    cursor: grab;
    opacity: 0;
    transition: opacity 140ms ease, color 140ms ease;
    user-select: none;
  }
  .row:hover .grip { opacity: 1; }
  .grip:hover { color: var(--fg-soft); }
  .grip:active { cursor: grabbing; }

  /* Botões de reordenar — só no mobile (ver media query) */
  .move {
    display: none;
    flex-direction: column;
    gap: 2px;
  }
  .move-btn {
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1;
    color: var(--fg-faint);
    width: 30px;
    height: 22px;
    border: 1px solid var(--rule);
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: border-color 140ms ease, color 140ms ease;
  }
  .move-btn:not(:disabled):active { border-color: var(--accent); color: var(--fg); }
  .move-btn:disabled { opacity: 0.25; }
  .row.done .text { color: var(--fg-ghost); text-decoration: line-through; text-decoration-color: var(--fg-ghost); }
  .row .text {
    font-family: var(--font-body);
    font-size: 15px;
    cursor: text;
    overflow-wrap: anywhere;
  }
  .row.pending-only {
    grid-template-columns: 1fr;
  }

  .check {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid var(--rule);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    transition: border-color 120ms ease, background 120ms ease;
  }
  .check:hover { border-color: var(--accent); }
  .check[aria-checked="true"] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--bg);
  }
  .tick { font-family: var(--font-display); font-size: 13px; line-height: 1; }

  .trash {
    font-family: var(--font-display);
    font-size: 22px;
    line-height: 1;
    color: var(--fg-ghost);
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    opacity: 0;
    transition: opacity 140ms ease, color 140ms ease, background 140ms ease;
  }
  .row:hover .trash { opacity: 1; }
  .trash:hover { color: var(--danger); background: color-mix(in oklab, var(--danger) 10%, transparent); }

  .edit {
    font-family: var(--font-body);
    font-size: 15px;
    border-bottom: 1px solid var(--accent);
    padding: 4px 0;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-6) var(--space-3);
    color: var(--fg-faint);
  }
  .empty p { font-family: var(--font-display); font-style: italic; font-size: 18px; color: var(--fg-soft); }
  .empty small { font-family: var(--font-body); font-size: 13px; color: var(--fg-ghost); margin-top: 4px; }

  @media (max-width: 760px) {
    .seg button { padding: 8px 12px; font-size: 11px; min-height: 36px; }
    .check { width: 24px; height: 24px; }
    .add-btn { width: 36px; height: 36px; font-size: 24px; }
    .trash { opacity: 1; font-size: 24px; width: 36px; height: 36px; }
    .grip { display: none; }
    .move { display: flex; }
    .row { padding: 10px 0; }
    .row .text { font-size: 16px; }
    .new input { font-size: 16px; padding: 8px 2px; }
  }
</style>
