<script lang="ts">
  type Props = {
    open: boolean;
    onclose: () => void;
    title?: string;
    eyebrow?: string;
    children: import('svelte').Snippet;
  };
  let { open, onclose, title, eyebrow, children }: Props = $props();

  function onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

{#if open}
  <div
    class="backdrop"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    onclick={onBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && onclose()}
    tabindex="-1"
  >
    <div class="sheet">
      <header>
        <div>
          {#if eyebrow}<span class="eyebrow">{eyebrow}</span>{/if}
          {#if title}<h2>{title}</h2>{/if}
        </div>
        <button class="close" aria-label="Fechar" onclick={onclose}>×</button>
      </header>
      <div class="content">
        {@render children()}
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: color-mix(in oklab, var(--ink) 38%, transparent);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 60;
    padding: var(--space-5);
    animation: fade 220ms ease;
  }
  .sheet {
    background: var(--bg);
    border: 1px solid var(--rule);
    border-radius: var(--r-4);
    box-shadow: var(--shadow-paper);
    width: 100%;
    max-width: 520px;
    max-height: 86vh;
    display: flex;
    flex-direction: column;
    animation: rise 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--space-5) var(--space-5) var(--space-3);
    border-bottom: 1px solid var(--rule-soft);
  }
  h2 {
    font-family: var(--font-display);
    font-size: 26px;

    line-height: 1.05;
    margin-top: var(--space-1);
  }
  .close {
    font-family: var(--font-display);
    font-size: 28px;
    line-height: 1;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    color: var(--fg-faint);
  }
  .close:hover { color: var(--fg); background: var(--bg-elev); }
  .content {
    padding: var(--space-5);
    overflow: auto;
  }
  @keyframes fade { from { opacity: 0; } }
  @keyframes rise {
    from { opacity: 0; transform: translateY(8px) scale(0.985); }
  }

  @media (max-width: 600px) {
    .backdrop {
      padding: var(--space-3);
      padding-top: max(var(--space-3), env(safe-area-inset-top));
      padding-bottom: max(var(--space-3), env(safe-area-inset-bottom));
      align-items: flex-start;
    }
    .sheet {
      max-width: 100%;
      max-height: 100%;
      border-radius: var(--r-3);
    }
    header { padding: var(--space-4) var(--space-4) var(--space-2); }
    h2 { font-size: 22px; }
    .content { padding: var(--space-4); }
  }
</style>
