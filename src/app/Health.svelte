<script lang="ts">
  // Caixinha única "Saúde": agrega as subseções de Hidratação e Alimentação.
  // Cada uma continua sendo um módulo independente (storage e eventos
  // próprios) — aqui só compartilham o mesmo Panel.
  import Panel from '$ui/Panel.svelte';
  import Water from '$modules/water/Water.svelte';
  import Meals from '$modules/meals/Meals.svelte';
  import Exercise from '$modules/exercise/Exercise.svelte';
  import type { EventBus } from '$core/types';

  type Props = { bus: EventBus };
  let { bus }: Props = $props();
</script>

<Panel title="Saúde" figure="hidratação, alimentação e exercícios">
  <div class="stack">
    <Water {bus} />
    <Meals {bus} />
    <Exercise {bus} />
  </div>
</Panel>

<style>
  .stack {
    display: flex;
    flex-direction: column;
  }
  /* Divisória entre subseções (Hidratação | Alimentação) */
  .stack > :global(* + *) {
    margin-top: var(--space-5);
    padding-top: var(--space-5);
    border-top: 1px solid var(--rule-soft);
  }
</style>
