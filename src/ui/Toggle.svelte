<script lang="ts">
  type Props = {
    checked: boolean;
    label: string;
    onchange?: (v: boolean) => void;
  };
  let { checked, label, onchange }: Props = $props();
</script>

<label class="toggle">
  <span class="label">{label}</span>
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    class="track"
    class:on={checked}
    onclick={() => onchange?.(!checked)}
  >
    <span class="thumb"></span>
  </button>
</label>

<style>
  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) 0;
  }
  .label {
    font-family: var(--font-body);
    color: var(--fg);
  }
  .track {
    position: relative;
    width: 40px;
    height: 22px;
    border-radius: 999px;
    background: var(--bg-sunk);
    border: 1px solid var(--rule);
    box-shadow: var(--shadow-press);
    transition: background 220ms ease;
  }
  .track.on { background: var(--accent); border-color: var(--accent-deep); }
  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: var(--bg);
    border: 1px solid var(--rule);
    transition: left 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .track.on .thumb { left: 20px; }
</style>
