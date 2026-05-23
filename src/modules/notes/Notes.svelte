<script lang="ts">
  import Panel from '$ui/Panel.svelte';
  import { rootStorage } from '$core/storage';
  import { app } from '$app/state.svelte';
  import { debounce } from '$core/debounce';
  import { loadPages, savePages, newPage, hasContent, type NotePage } from './store';
  import type { DateKey, EventBus } from '$core/types';

  type Props = { bus: EventBus };
  let { bus }: Props = $props();

  const storage = rootStorage.namespaced('notes');

  let pages = $state<NotePage[]>([]);
  let activeId = $state<string | null>(null);
  let lastSavedDate = $state<DateKey>(app.selectedDate);
  let savedAt = $state<number | null>(null);
  let editingTitleId = $state<string | null>(null);

  $effect(() => {
    void load(app.selectedDate);
  });

  $effect(() => {
    const offs = [
      bus.on('data:imported', () => load(app.selectedDate)),
      bus.on('data:cleared', () => {
        pages = [];
        activeId = null;
      }),
    ];
    return () => offs.forEach((o) => o());
  });

  async function load(date: DateKey) {
    flushSave();
    const loaded = await loadPages(storage, date);
    pages = loaded.length > 0 ? loaded : [newPage('nova nota')];
    activeId = pages[0]?.id ?? null;
    lastSavedDate = date;
    savedAt = null;
  }

  const persist = debounce(async (date: DateKey, snapshot: NotePage[]) => {
    await savePages(storage, date, snapshot);
    savedAt = Date.now();
    bus.emit('note:edited', { date, hasContent: hasContent(snapshot) });
  }, 500);

  function flushSave() {
    persist.flush();
  }

  function schedulePersist() {
    persist(lastSavedDate, $state.snapshot(pages) as NotePage[]);
  }

  function addPage() {
    const p = newPage('nova nota');
    pages = [...pages, p];
    activeId = p.id;
    schedulePersist();
    setTimeout(() => focusTextarea(), 0);
  }

  function removePage(id: string) {
    const idx = pages.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const next = pages.filter((p) => p.id !== id);
    pages = next.length > 0 ? next : [newPage('nova nota')];
    if (activeId === id) {
      activeId = pages[Math.max(0, idx - 1)]?.id ?? pages[0]?.id ?? null;
    }
    schedulePersist();
  }

  function onContentInput(e: Event) {
    if (!activeId) return;
    const target = e.target as HTMLTextAreaElement;
    pages = pages.map((p) => (p.id === activeId ? { ...p, content: target.value } : p));
    schedulePersist();
  }

  function onTitleCommit(id: string, value: string) {
    const trimmed = value.trim() || 'sem título';
    pages = pages.map((p) => (p.id === id ? { ...p, title: trimmed } : p));
    editingTitleId = null;
    schedulePersist();
  }

  function focusTextarea() {
    const el = document.querySelector<HTMLTextAreaElement>('[data-shortcut="note"]');
    el?.focus();
  }

  let active = $derived(pages.find((p) => p.id === activeId) ?? null);

  let savedLabel = $state('');
  $effect(() => {
    function format(): string {
      if (!savedAt) return 'salvo automaticamente';
      const ago = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
      if (ago < 2) return 'salvo agora';
      if (ago < 60) return `salvo há ${ago}s`;
      return `salvo há ${Math.floor(ago / 60)}min`;
    }
    const i = setInterval(() => { savedLabel = format(); }, 1000);
    savedLabel = format();
    return () => clearInterval(i);
  });
</script>

<Panel title="Notas" flush>
  {#snippet actions()}
    <span class="status" aria-live="polite">{savedLabel}</span>
  {/snippet}

  <div class="tabs" role="tablist" aria-label="Páginas de notas do dia">
    <div class="tabs-scroll">
      {#each pages as p (p.id)}
        <div class="tab" class:active={p.id === activeId} role="tab" aria-selected={p.id === activeId}>
          {#if editingTitleId === p.id}
            <!-- svelte-ignore a11y_autofocus -->
            <input
              class="tab-title-edit"
              value={p.title}
              autofocus
              onblur={(e) => onTitleCommit(p.id, (e.target as HTMLInputElement).value)}
              onkeydown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); onTitleCommit(p.id, (e.target as HTMLInputElement).value); }
                if (e.key === 'Escape') { editingTitleId = null; }
              }}
            />
          {:else}
            <button
              class="tab-title"
              onclick={() => { activeId = p.id; }}
              ondblclick={() => { editingTitleId = p.id; }}
              title="duplo clique para renomear"
            >
              {p.title}
            </button>
          {/if}
          {#if pages.length > 1}
            <button class="tab-close" aria-label={`Remover ${p.title}`} onclick={() => removePage(p.id)}>×</button>
          {/if}
        </div>
      {/each}
    </div>
    <button class="tab-add" aria-label="Nova nota" title="nova nota" onclick={addPage}>+</button>
  </div>

  <div class="paper">
    {#if active}
      <textarea
        data-shortcut="note"
        value={active.content}
        oninput={onContentInput}
        placeholder={`escreva.\n\nuse o + acima para criar várias notas no mesmo dia.`}
        spellcheck="true"
        aria-label={`Conteúdo de ${active.title}`}
      ></textarea>
    {/if}
  </div>

  <footer class="meta">
    <span>{pages.length} {pages.length === 1 ? 'nota' : 'notas'}</span>
    <span class="hint">⌨ N para focar · duplo clique no título para renomear</span>
  </footer>
</Panel>

<style>
  .status {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: var(--tracking-uppercase);
    text-transform: uppercase;
    color: var(--fg-faint);
  }

  .tabs {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--rule);
    background: var(--bg-elev);
    padding: 0 var(--space-3);
    gap: 1px;
    overflow: hidden;
  }
  .tabs-scroll {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    flex: 1;
    min-width: 0;
  }
  .tabs-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 6px 8px 12px;
    border-right: 1px solid var(--rule-soft);
    background: transparent;
    transition: background 140ms ease;
    white-space: nowrap;
    position: relative;
  }
  .tab.active {
    background: var(--bg);
    box-shadow: 0 1px 0 var(--bg);
  }
  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 8px; right: 8px;
    height: 2px;
    background: var(--accent);
  }
  .tab-title {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 14px;
    color: var(--fg-soft);
    padding: 2px 4px;
    border-radius: 2px;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tab.active .tab-title { color: var(--fg); }
  .tab-title-edit {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 14px;
    color: var(--fg);
    padding: 2px 4px;
    border-bottom: 1px solid var(--accent);
    width: 160px;
  }
  .tab-close {
    font-family: var(--font-display);
    font-size: 16px;
    line-height: 1;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    color: var(--fg-ghost);
    transition: color 140ms ease, background 140ms ease;
  }
  .tab-close:hover { color: var(--danger); background: color-mix(in oklab, var(--danger) 12%, transparent); }
  .tab-add {
    font-family: var(--font-display);
    font-size: 20px;
    line-height: 1;
    color: var(--fg-faint);
    width: 32px;
    flex-shrink: 0;
    border-left: 1px solid var(--rule-soft);
    transition: color 140ms ease, background 140ms ease;
  }
  .tab-add:hover { color: var(--accent-deep); background: var(--bg); }

  .paper {
    position: relative;
    flex: 1;
    display: flex;
    min-height: 360px;
  }
  textarea {
    flex: 1;
    width: 100%;
    padding: var(--space-4) var(--space-5);
    font-family: var(--font-body);
    font-size: 15px;
    line-height: 1.65;
    color: var(--fg);
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    scrollbar-width: none;
  }
  textarea::-webkit-scrollbar { display: none; }
  textarea::placeholder {
    color: var(--fg-ghost);
    font-family: var(--font-display);
    font-style: italic;
    font-size: 18px;
    line-height: 1.65;
  }

  .meta {
    border-top: 1px solid var(--rule);
    padding: var(--space-3) var(--space-5);
    display: flex;
    gap: var(--space-3);
    align-items: center;
    color: var(--fg-faint);
    font-family: var(--font-mono);
    font-size: 11px;
    flex-wrap: wrap;
  }
  .meta .hint { margin-left: auto; }

  @media (max-width: 720px) {
    .meta .hint { display: none; }
    .meta { font-size: 10px; padding: var(--space-2) var(--space-4); }
    textarea {
      padding: var(--space-3) var(--space-4);
      line-height: 1.55;
    }
    .tab-title { font-size: 13px; max-width: 140px; }
    .paper { min-height: 280px; }
  }
</style>
