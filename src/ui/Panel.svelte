<script lang="ts">
  type Props = {
    label?: string;
    title?: string;
    figure?: string;
    children: import('svelte').Snippet;
    actions?: import('svelte').Snippet;
    flush?: boolean;
  };
  let { label, title, figure, children, actions, flush = false }: Props = $props();
</script>

<section class="panel" class:flush aria-label={title ?? label}>
  {#if label || title || actions}
    <header class="head">
      <div class="head-text">
        {#if label}<span class="eyebrow">{label}</span>{/if}
        {#if title}<h2>{title}</h2>{/if}
        {#if figure}<span class="figure">{figure}</span>{/if}
      </div>
      {#if actions}
        <div class="head-actions">{@render actions()}</div>
      {/if}
    </header>
  {/if}
  <div class="body">
    {@render children()}
  </div>
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    background: var(--bg);
    border: 1px solid var(--rule);
    border-radius: var(--r-4);
    box-shadow: var(--shadow-paper);
    overflow: hidden;
    position: relative;
  }
  .panel::before {
    /* fita lateral, sutil */
    content: '';
    position: absolute;
    top: 14px;
    bottom: 14px;
    left: 0;
    width: 2px;
    background: var(--rule);
    opacity: 0.6;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--rule-soft);
    flex-shrink: 0;
  }
  .head-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  h2 {
    font-family: var(--font-display);
    font-size: 18px;
    line-height: 1.1;
    font-weight: 500;

    color: var(--fg);
  }
  .figure {
    font-family: var(--font-body);
    font-style: italic;
    color: var(--fg-faint);
    font-size: 12px;
  }
  .head-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
  .body {
    flex: 1;
    padding: var(--space-4);
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .panel.flush .body { padding: 0; }
</style>
