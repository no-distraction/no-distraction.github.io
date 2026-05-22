<script lang="ts">
  import Button from '$ui/Button.svelte';
  import Toggle from '$ui/Toggle.svelte';
  import { rootStorage, storageEstimate } from '$core/storage';
  import { CURRENT_SCHEMA_VERSION } from '$core/migrations';
  import { app, pushToast } from '$app/state.svelte';
  import type { EventBus } from '$core/types';
  import type { ThemeController } from '$app/theme';
  import type { PomodoroConfig } from '$modules/pomodoro/engine';
  import { DEFAULT_CONFIG } from '$modules/pomodoro/engine';
  import { type WaterConfig, formatMl, totalGoalMl } from '$modules/water/calculate';

  type Props = { bus: EventBus; theme: ThemeController };
  let { bus, theme }: Props = $props();

  const pomStorage = rootStorage.namespaced('pomodoro');
  const waterStorage = rootStorage.namespaced('water');

  let pomConfig = $state<PomodoroConfig>(DEFAULT_CONFIG);
  let waterConfig = $state<WaterConfig | null>(null);
  let waterWeight = $state('');
  let usage = $state<{ usage: number; quota: number } | null>(null);
  let confirmingClear = $state(false);

  $effect(() => {
    void hydrate();
  });

  async function hydrate() {
    const c = await pomStorage.get<PomodoroConfig>('config');
    if (c) pomConfig = c;
    const wc = await waterStorage.get<WaterConfig>('config');
    if (wc) {
      waterConfig = wc;
      waterWeight = String(wc.weightKg);
    }
    usage = await storageEstimate();
  }

  function fmtMb(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function setPomField(field: keyof PomodoroConfig, value: number | boolean) {
    pomConfig = { ...pomConfig, [field]: value };
    await pomStorage.set('config', pomConfig);
    bus.emit('pomodoro:config-changed', {});
  }

  function clampMin(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  async function saveWater() {
    const trimmed = String(waterWeight).trim();
    if (trimmed === '') {
      // peso apagado — remove o config para o dash voltar ao "Configurar peso"
      await waterStorage.remove('config');
      waterConfig = null;
      bus.emit('water:config-changed', {});
      return;
    }
    const weightKg = Number.parseFloat(trimmed.replace(',', '.'));
    if (!Number.isFinite(weightKg) || weightKg < 25 || weightKg > 250) return;
    const next: WaterConfig = {
      weightKg,
      exercises: waterConfig?.exercises ?? false,
      hotClimate: waterConfig?.hotClimate ?? false,
    };
    await waterStorage.set('config', next);
    waterConfig = next;
    bus.emit('water:config-changed', {});
  }

  async function toggleWaterFlag(key: 'exercises' | 'hotClimate', value: boolean) {
    if (!waterConfig) return;
    const next: WaterConfig = { ...waterConfig, [key]: value };
    await waterStorage.set('config', next);
    waterConfig = next;
    bus.emit('water:config-changed', {});
  }

  async function exportData() {
    const data = await rootStorage.exportAll();
    const payload = {
      app: 'no-distraction',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `no-distraction-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Backup salvo no seu computador.');
  }

  async function importData(file: File) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (json.app !== 'no-distraction') throw new Error('arquivo não reconhecido');
      if (typeof json.schemaVersion !== 'number') throw new Error('versão ausente');
      if (json.schemaVersion > CURRENT_SCHEMA_VERSION) {
        throw new Error('arquivo veio de uma versão mais nova do app');
      }
      await rootStorage.importAll(json.data ?? {});
      bus.emit('data:imported', {});
      pushToast('Importado. Recarregando…');
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      pushToast(`Falha ao importar: ${(err as Error).message}`, 'danger', 4000);
    }
  }

  function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void importData(file);
    input.value = '';
  }

  async function clearAll() {
    await rootStorage.clearAll();
    bus.emit('data:cleared', {});
    pushToast('Tudo removido. Recarregando…', 'danger');
    setTimeout(() => location.reload(), 600);
  }
</script>

<div class="wrap">
  <!-- Aparência -->
  <section>
    <h3>Aparência</h3>
    <div class="theme-row">
      <button class="swatch light" class:active={app.theme === 'light'} onclick={() => theme.set('light')} aria-label="Tema claro">
        <span>claro</span>
      </button>
      <button class="swatch dark" class:active={app.theme === 'dark'} onclick={() => theme.set('dark')} aria-label="Tema escuro">
        <span>escuro</span>
      </button>
    </div>
  </section>

  <!-- Pomodoro -->
  <section>
    <h3>Pomodoro</h3>
    <div class="time-grid">
      <label>
        <span>foco</span>
        <div class="num-input">
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            value={pomConfig.focusMin}
            onchange={(e) => setPomField('focusMin', clampMin(Number((e.target as HTMLInputElement).value), 1, 180))}
          />
          <small>min</small>
        </div>
      </label>
      <label>
        <span>pausa curta</span>
        <div class="num-input">
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            value={pomConfig.shortMin}
            onchange={(e) => setPomField('shortMin', clampMin(Number((e.target as HTMLInputElement).value), 1, 60))}
          />
          <small>min</small>
        </div>
      </label>
      <label>
        <span>pausa longa</span>
        <div class="num-input">
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            value={pomConfig.longMin}
            onchange={(e) => setPomField('longMin', clampMin(Number((e.target as HTMLInputElement).value), 1, 60))}
          />
          <small>min</small>
        </div>
      </label>
      <label>
        <span>ciclos até pausa longa</span>
        <div class="num-input">
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            value={pomConfig.cyclesUntilLong}
            onchange={(e) => setPomField('cyclesUntilLong', clampMin(Number((e.target as HTMLInputElement).value), 2, 10))}
          />
          <small>×</small>
        </div>
      </label>
    </div>
    <Toggle checked={pomConfig.soundEnabled} label="tocar sinal sonoro ao fim do ciclo" onchange={(v) => setPomField('soundEnabled', v)} />
  </section>

  <!-- Hidratação -->
  <section>
    <h3>Hidratação</h3>
    <label class="single-field">
      <span>peso</span>
      <div class="num-input">
        <input
          type="text"
          inputmode="decimal"
          pattern="[0-9]*[.,]?[0-9]*"
          placeholder="70"
          bind:value={waterWeight}
          onblur={saveWater}
          onkeydown={(e) => e.key === 'Enter' && saveWater()}
        />
        <small>kg</small>
      </div>
    </label>
    <Toggle
      checked={waterConfig?.exercises ?? false}
      label="pratico exercícios físicos (+500 ml)"
      onchange={(v) => toggleWaterFlag('exercises', v)}
    />
    <Toggle
      checked={waterConfig?.hotClimate ?? false}
      label="moro em clima quente (+500 ml)"
      onchange={(v) => toggleWaterFlag('hotClimate', v)}
    />
    {#if waterConfig}
      <p class="goal">meta diária: <strong>{formatMl(totalGoalMl(waterConfig))}</strong></p>
    {/if}
  </section>

  <!-- Backup -->
  <section>
    <h3>Backup</h3>
    <p class="lead">tudo vive no seu navegador. faça backup periodicamente.</p>
    <div class="row">
      <Button variant="inked" onclick={exportData}>Exportar .json</Button>
      <label class="file">
        <span>Importar .json</span>
        <input type="file" accept="application/json" onchange={onFile} />
      </label>
    </div>
    {#if usage}
      <small class="usage">usando {fmtMb(usage.usage)} de ~{fmtMb(usage.quota)} disponíveis</small>
    {/if}
  </section>

  <!-- Recomeçar -->
  <section>
    <h3>Recomeçar</h3>
    {#if !confirmingClear}
      <Button variant="danger" onclick={() => (confirmingClear = true)}>Limpar todos os dados</Button>
    {:else}
      <p class="lead danger">apaga tudo neste dispositivo. quer mesmo?</p>
      <div class="row">
        <Button variant="danger" onclick={clearAll}>Sim, apagar</Button>
        <Button variant="ghost" onclick={() => (confirmingClear = false)}>Cancelar</Button>
      </div>
    {/if}
  </section>

</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    max-width: 460px;
    margin: 0 auto;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    text-align: center;
  }

  h3 {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 400;

    color: var(--fg);
    letter-spacing: var(--tracking-uppercase);
    text-transform: uppercase;
    font-style: normal;
  }
  h3::after {
    content: '';
    display: block;
    width: 28px;
    height: 1px;
    background: var(--rule);
    margin: 6px auto 0;
  }

  .lead {
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--fg-soft);
  }
  .lead.danger { color: var(--danger); }

  .row {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
    flex-wrap: wrap;
  }

  /* Tema */
  .theme-row { display: flex; gap: var(--space-3); justify-content: center; }
  .swatch {
    flex: 1;
    max-width: 160px;
    aspect-ratio: 16 / 9;
    border-radius: var(--r-3);
    border: 1px solid var(--rule);
    position: relative;
    overflow: hidden;
    transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
  }
  .swatch.light { background: #F4EEE0; color: #1A1714; }
  .swatch.dark  { background: #15130F; color: #EFE7D3; }
  .swatch span {
    position: absolute;
    bottom: 6px; left: 0; right: 0;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 13px;
  }
  .swatch.active {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px color-mix(in oklab, var(--accent) 40%, transparent);
  }
  .swatch:hover { transform: translateY(-1px); }

  /* Pomodoro grid */
  .time-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }
  .time-grid label,
  .single-field {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .time-grid label > span,
  .single-field > span {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: var(--tracking-uppercase);
    text-transform: uppercase;
    color: var(--fg-faint);
  }
  .num-input {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    border-bottom: 1px solid var(--rule);
    padding: 2px 0;
    min-width: 80px;
    justify-content: center;
  }
  .num-input input {
    font-family: var(--font-display);
    font-size: 22px;

    color: var(--fg);
    text-align: center;
    width: 64px;
    background: transparent;
  }
  .num-input small {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 12px;
    color: var(--fg-faint);
  }

  .goal {
    margin-top: var(--space-2);
    font-family: var(--font-body);
    color: var(--fg-soft);
    font-size: 14px;
  }
  .goal strong {
    color: var(--accent-deep);
    font-style: italic;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 18px;
  }

  /* Backup */
  .file {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--rule);
    border-radius: var(--r-2);
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--fg-soft);
    cursor: pointer;
    transition: background 140ms ease;
  }
  .file:hover { background: var(--bg-elev); color: var(--fg); }
  .file input { display: none; }

  .usage {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--fg-faint);
  }

  @media (max-width: 600px) {
    .wrap { gap: var(--space-5); }
    .time-grid { grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .num-input input { font-size: 24px; width: 80px; }
    .swatch { max-width: 100%; }
    .file { padding: 10px 16px; min-height: 40px; }
  }
</style>
