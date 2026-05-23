<script lang="ts">
  import { onMount } from 'svelte';
  import Calendar from '$modules/calendar/Calendar.svelte';
  import Todo from '$modules/todo/Todo.svelte';
  import Notes from '$modules/notes/Notes.svelte';
  import Pomodoro from '$modules/pomodoro/Pomodoro.svelte';
  import Health from './Health.svelte';
  import LoFi from '$modules/lofi/LoFi.svelte';
  import Settings from '$modules/settings/Settings.svelte';
  import Modal from '$ui/Modal.svelte';
  import type { EventBus } from '$core/types';
  import { app } from './state.svelte';
  import { formatLong, todayKey } from '$core/date';
  import type { ThemeController } from './theme';
  import type { Action } from 'svelte/action';

  // Feedback de troca de dia: a área de conteúdo inteira faz um leve
  // "assentar" (fade + sobe) sempre que a data muda, sinalizando que os
  // dados exibidos passaram a ser os da nova data. Não dispara na carga.
  const dayChange: Action<HTMLElement, string> = (node) => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    return {
      update() {
        if (reduce) return;
        node.animate(
          [
            { opacity: 0.35, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
      },
    };
  };

  type Props = {
    bus: EventBus;
    theme: ThemeController;
  };
  let { bus, theme }: Props = $props();

  onMount(() => {
    const off = bus.on('theme:changed', ({ theme: t }) => {
      app.theme = t;
    });
    app.theme = theme.current;
    return () => off();
  });

  let activeMobileTab = $state<'calendar' | 'tasks' | 'health' | 'notes' | 'pomodoro' | 'lofi'>('tasks');

  let isToday = $derived(app.selectedDate === todayKey());

  function goToday() {
    const t = todayKey();
    app.selectedDate = t;
    bus.emit('day:selected', { date: t });
  }
</script>

<header class="masthead">
  <div class="mast-actions">
    <button class="date-pill" aria-live="polite" title={isToday ? 'hoje' : 'voltar para hoje'} onclick={goToday}>
      {#if isToday}<em>hoje,</em>{/if}
      {formatLong(app.selectedDate)}
    </button>

    <button class="icon-btn" aria-label="Atalhos" title="Atalhos" onclick={() => (app.showShortcuts = true)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9.2" />
        <path d="M9.5 9.4 a2.6 2.6 0 1 1 3.6 2.4 c-.9.4-1.1 1-1.1 1.7 v.4" />
        <circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none" />
      </svg>
    </button>

    <button class="icon-btn" aria-label="Alternar tema" title="Alternar tema" onclick={() => theme.toggle()}>
      {#if app.theme === 'light'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.5 14.3 A8.5 8.5 0 1 1 9.7 3.5 a7 7 0 0 0 10.8 10.8 z" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3.8" />
          <path d="M12 3.3 V5.5 M12 18.5 V20.7 M3.3 12 H5.5 M18.5 12 H20.7 M5.6 5.6 L7.2 7.2 M16.8 16.8 L18.4 18.4 M5.6 18.4 L7.2 16.8 M16.8 7.2 L18.4 5.6" />
        </svg>
      {/if}
    </button>

    <button class="icon-btn" aria-label="Configurar" title="Configurar" onclick={() => (app.showSettings = true)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    </button>
  </div>
</header>

<nav class="tabs" aria-label="Painéis (mobile)">
  <button class:active={activeMobileTab === 'tasks'} onclick={() => (activeMobileTab = 'tasks')}>Tarefas</button>
  <button class:active={activeMobileTab === 'health'} onclick={() => (activeMobileTab = 'health')}>Saúde</button>
  <button class:active={activeMobileTab === 'notes'} onclick={() => (activeMobileTab = 'notes')}>Notas</button>
  <button class:active={activeMobileTab === 'pomodoro'} onclick={() => (activeMobileTab = 'pomodoro')}>Pomodoro</button>
  <button class:active={activeMobileTab === 'calendar'} onclick={() => (activeMobileTab = 'calendar')}>Agenda</button>
  <button class:active={activeMobileTab === 'lofi'} onclick={() => (activeMobileTab = 'lofi')}>Lo-Fi</button>
</nav>

<main class="layout" use:dayChange={app.selectedDate}>
  <section class="workspace" aria-label="Workspace">
    <div class="ws-cell tall" class:hidden-mobile={activeMobileTab !== 'tasks'}>
      <Todo {bus} />
    </div>
    <div class="ws-cell" class:hidden-mobile={activeMobileTab !== 'health'}>
      <Health {bus} />
    </div>
    <div class="ws-cell tall" class:hidden-mobile={activeMobileTab !== 'notes'}>
      <Notes {bus} />
    </div>
    <div class="ws-cell" class:hidden-mobile={activeMobileTab !== 'lofi'}>
      <LoFi />
    </div>
  </section>

  <aside class="right-fixed" aria-label="Foco e agenda">
    <div class="rf-cell pomodoro-cell" class:hidden-mobile={activeMobileTab !== 'pomodoro'}>
      <Pomodoro {bus} />
    </div>
    <div class="rf-cell calendar-cell" class:hidden-mobile={activeMobileTab !== 'calendar'}>
      <Calendar {bus} />
    </div>
  </aside>
</main>

<footer class="site-footer">
  <a href="https://www.linkedin.com/in/brennocm" target="_blank" rel="noopener noreferrer">brennocm</a>
  <span class="sep">|</span> © 20∞
</footer>

{#if app.toast}
  <div class="toast" role="status" class:danger={app.toast.tone === 'danger'} aria-live="polite">
    {app.toast.text}
  </div>
{/if}

<Modal open={app.showSettings} onclose={() => (app.showSettings = false)} title="Configurações">
  <Settings {bus} {theme} />
</Modal>

<Modal open={app.showShortcuts} onclose={() => (app.showShortcuts = false)} title="Atalhos">
  <ul class="shortcuts">
    <li><kbd>Espaço</kbd> <span>iniciar / pausar pomodoro</span></li>
    <li><kbd>← →</kbd> <span>dia anterior / próximo</span></li>
    <li><kbd>T</kbd> <span>nova tarefa</span></li>
    <li><kbd>N</kbd> <span>focar notas</span></li>
    <li><kbd>W</kbd> <span>focar água</span></li>
    <li><kbd>Shift + D</kbd> <span>alternar tema</span></li>
    <li><kbd>Ctrl + ,</kbd> <span>configurações</span></li>
    <li><kbd>?</kbd> <span>esta janela</span></li>
    <li><kbd>Esc</kbd> <span>fechar janelas</span></li>
  </ul>
</Modal>

<style>
  /* ── Header mínimo, ações à direita ── */
  .masthead {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: var(--space-3) var(--space-7);
    border-bottom: 1px solid var(--rule);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    background: var(--bg);
    z-index: 10;
    height: 58px;
    box-sizing: border-box;
  }
  .mast-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .date-pill {
    font-family: var(--font-body);
    color: var(--fg-soft);
    font-size: 13px;
    margin-right: var(--space-3);
    padding: 4px 10px;
    border-radius: 999px;
    transition: background 140ms ease, color 140ms ease;
    cursor: pointer;
  }
  .date-pill:hover {
    background: var(--bg-elev);
    color: var(--fg);
  }
  .date-pill em {
    font-style: italic;
    color: var(--accent-deep);
    margin-right: 4px;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    color: var(--fg-soft);
    transition: background 140ms ease, color 140ms ease;
  }
  .icon-btn svg { width: 18px; height: 18px; }
  .icon-btn:hover { background: var(--bg-elev); color: var(--fg); }
  .icon-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .tabs {
    display: none;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid var(--rule);
    overflow-x: auto;
    flex-shrink: 0;
  }
  .tabs button {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: var(--tracking-uppercase);
    text-transform: uppercase;
    color: var(--fg-faint);
    padding: 8px 0;
    border-bottom: 1px solid transparent;
    white-space: nowrap;
  }
  .tabs button.active { color: var(--fg); border-bottom-color: var(--ink); }

  /* ─────────────────────────────────────────────────────────────────
     Layout: workspace amplo à esquerda (rola normal); pomodoro fixo
     à direita, 100vh acompanhando o scroll.
     ───────────────────────────────────────────────────────────────── */
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: var(--space-6);
    padding: var(--space-5) var(--space-7);
    align-items: start;
  }

  .workspace {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    min-width: 0;
  }
  .ws-cell {
    display: flex;
    min-width: 0;
  }
  .ws-cell.tall { min-height: 480px; }
  .ws-cell > :global(*) { width: 100%; }

  .right-fixed {
    position: sticky;
    top: calc(58px + var(--space-3));
    height: calc(100vh - 58px - var(--space-3) * 2);
    display: grid;
    /* O Calendário tem prioridade de legibilidade: piso de ~230px pra as
       semanas nunca esmagarem. O Pomodoro cede a altura — o disco encolhe
       (e o número junto, via container query no .time) conforme aperta. */
    grid-template-rows: minmax(0, 6fr) minmax(230px, 4fr);
    gap: var(--space-5);
    min-height: 0;
  }
  .rf-cell {
    display: flex;
    min-height: 0;
    overflow: hidden;
  }
  .rf-cell > :global(*) {
    width: 100%;
    height: 100%;
  }

  .site-footer {
    text-align: center;
    padding: var(--space-5) var(--space-7);
    padding-bottom: calc(var(--space-5) + env(safe-area-inset-bottom));
    border-top: 1px solid var(--rule);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: var(--tracking-wide);
    color: var(--fg-faint);
    flex-shrink: 0;
  }
  .site-footer a {
    color: var(--fg-soft);
    text-decoration: none;
    border-bottom: 1px solid var(--rule);
    transition: color 140ms ease, border-color 140ms ease;
  }
  .site-footer a:hover { color: var(--accent-deep); border-bottom-color: var(--accent); }
  .site-footer .sep { margin: 0 var(--space-2); color: var(--fg-ghost); }

  .toast {
    position: fixed;
    bottom: var(--space-6);
    left: 50%;
    transform: translateX(-50%);
    background: var(--ink);
    color: var(--bg);
    padding: 10px 18px;
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: var(--tracking-wide);
    border-radius: var(--r-3);
    box-shadow: var(--shadow-paper);
    z-index: 70;
    animation: toast-rise 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .toast.danger { background: var(--danger); }
  @keyframes toast-rise {
    from { opacity: 0; transform: translate(-50%, 8px); }
  }

  .shortcuts {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: var(--space-2);
  }
  .shortcuts li {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px dashed var(--rule-soft);
  }
  .shortcuts li:last-child { border-bottom: none; }
  kbd {
    font-family: var(--font-mono);
    font-size: 12px;
    background: var(--bg-sunk);
    border: 1px solid var(--rule);
    border-bottom-width: 2px;
    border-radius: 4px;
    padding: 2px 6px;
    color: var(--fg);
    min-width: 80px;
    text-align: center;
  }
  .shortcuts span { color: var(--fg-soft); }

  /* ── Tablet (760 – 1100px): pomodoro/agenda lado a lado no topo ── */
  @media (max-width: 1100px) {
    .masthead { padding: var(--space-3) var(--space-5); }
    .layout {
      grid-template-columns: 1fr;
      padding: var(--space-4) var(--space-5);
      gap: var(--space-5);
    }
    .right-fixed {
      position: static;
      height: auto;
      grid-template-rows: auto;
      grid-template-columns: 6fr 4fr;
      gap: var(--space-4);
      order: -1;
    }
    .rf-cell { min-height: 340px; overflow: visible; }
  }

  /* ── Mobile (<760px): tabs no topo + coluna única ── */
  @media (max-width: 760px) {
    .masthead {
      padding: var(--space-2) var(--space-4);
      padding-top: max(var(--space-2), env(safe-area-inset-top));
      min-height: 52px;
      height: auto;
    }
    .mast-actions {
      width: 100%;
      justify-content: space-between;
      flex-wrap: nowrap;
      gap: var(--space-1);
    }
    .date-pill {
      margin-right: 0;
      padding: 6px 10px;
      flex: 1;
      min-width: 0;
      text-align: left;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon-btn {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }
    .icon-btn svg { width: 20px; height: 20px; }
    .tabs {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4);
    }
    .tabs button {
      padding: 10px 4px;
      font-size: 11px;
      min-height: 40px;
    }
    .layout {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
      padding: var(--space-3) var(--space-4);
      padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
      gap: var(--space-4);
    }
    .right-fixed {
      grid-template-columns: 1fr;
      grid-template-rows: auto;
      gap: var(--space-4);
    }
    .rf-cell { min-height: 0; }
    .workspace { gap: var(--space-4); }
    .ws-cell.tall { min-height: 400px; }
    .hidden-mobile { display: none; }
    .site-footer { display: none; }
  }
</style>
