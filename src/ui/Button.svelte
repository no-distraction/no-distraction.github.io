<script lang="ts">
  type Props = {
    variant?: 'ghost' | 'inked' | 'pressed' | 'danger';
    size?: 'sm' | 'md';
    title?: string;
    ariaLabel?: string;
    disabled?: boolean;
    type?: 'button' | 'submit';
    onclick?: (e: MouseEvent) => void;
    children: import('svelte').Snippet;
  };
  let {
    variant = 'ghost',
    size = 'md',
    title,
    ariaLabel,
    disabled = false,
    type = 'button',
    onclick,
    children,
  }: Props = $props();
</script>

<button {type} {title} aria-label={ariaLabel} {disabled} class={`btn ${variant} ${size}`} {onclick}>
  {@render children()}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: var(--r-2);
    padding: 8px 14px;
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--fg-soft);
    background: transparent;
    border: 1px solid transparent;
    transition: background 160ms ease, color 160ms ease, border-color 160ms ease, transform 80ms ease;
  }
  .btn:hover { color: var(--fg); background: var(--bg-elev); }
  .btn:active { transform: translateY(1px); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn.sm { padding: 5px 10px; font-size: 11px; }

  .btn.inked {
    color: var(--bg);
    background: var(--ink);
    border-color: var(--ink);
  }
  :global([data-theme='dark']) .btn.inked {
    color: var(--paper);
    background: var(--ink);
    border-color: var(--ink-soft);
  }
  .btn.inked:hover { background: var(--ink-soft); }

  .btn.pressed {
    border-color: var(--rule);
    box-shadow: var(--shadow-press);
    color: var(--fg);
  }
  .btn.pressed:hover { background: var(--bg-sunk); }

  .btn.danger { color: var(--danger); }
  .btn.danger:hover { background: color-mix(in oklab, var(--danger) 12%, transparent); }
</style>
