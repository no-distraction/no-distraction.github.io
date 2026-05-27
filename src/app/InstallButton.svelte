<script lang="ts">
  import Modal from '$ui/Modal.svelte';
  import { install, promptInstall } from './install.svelte';
  import { pushToast } from './state.svelte';

  let iosOpen = $state(false);

  // Mostra só quando há algo a fazer: Android com prompt pronto, ou iOS não instalado.
  let visible = $derived(!install.installed && (install.canPrompt || install.isIOS));

  async function onClick() {
    if (install.isIOS) {
      iosOpen = true;
      return;
    }
    const outcome = await promptInstall();
    if (outcome === 'accepted') pushToast('Instalando o app…');
  }
</script>

{#if visible}
  <button class="install-btn" aria-label="Instalar app" title="Instalar app" onclick={onClick}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3.5 V14.5 M7.5 10 L12 14.5 L16.5 10" />
      <path d="M4.5 17 v1.5 a2 2 0 0 0 2 2 h11 a2 2 0 0 0 2-2 V17" />
    </svg>
  </button>
{/if}

<Modal open={iosOpen} onclose={() => (iosOpen = false)} eyebrow="Instalar" title="Adicionar à Tela de Início">
  <ol class="ios-steps">
    <li>
      Toque em <strong>Compartilhar</strong>
      <svg class="inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 3.5 V15 M8.5 7 L12 3.5 L15.5 7" />
        <path d="M6 11 H5 a1.5 1.5 0 0 0-1.5 1.5 v6 A1.5 1.5 0 0 0 5 20 h14 a1.5 1.5 0 0 0 1.5-1.5 v-6 A1.5 1.5 0 0 0 19 11 h-1" />
      </svg>
      na barra do Safari.
    </li>
    <li>Role e escolha <strong>Adicionar à Tela de Início</strong>.</li>
    <li>Confirme em <strong>Adicionar</strong> — o app abre em tela cheia, sem a barra do navegador.</li>
  </ol>
  <p class="note">No iPhone/iPad a instalação é feita pelo próprio Safari; outros navegadores não oferecem essa opção.</p>
</Modal>

<style>
  /* Espelha o .icon-btn do masthead (estilos lá são escopados ao App). */
  .install-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    color: var(--fg-soft);
    transition: background 140ms ease, color 140ms ease;
  }
  .install-btn svg { width: 18px; height: 18px; }
  .install-btn:hover { background: var(--bg-elev); color: var(--fg); }
  .install-btn:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .ios-steps {
    margin: 0;
    padding-left: 1.3em;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    font-family: var(--font-body);
    font-size: 15px;
    color: var(--fg);
    line-height: 1.5;
  }
  .ios-steps strong { color: var(--accent-deep); font-weight: 600; }
  .inline {
    width: 17px;
    height: 17px;
    vertical-align: -3px;
    margin: 0 1px;
    color: var(--fg-soft);
  }
  .note {
    margin-top: var(--space-4);
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--fg-soft);
  }

  @media (max-width: 760px) {
    .install-btn { width: 40px; height: 40px; flex-shrink: 0; }
    .install-btn svg { width: 20px; height: 20px; }
  }
</style>
