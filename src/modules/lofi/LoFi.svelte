<script lang="ts">
  import Panel from '$ui/Panel.svelte';

  // Live "lofi hip hop radio · beats to relax/study to".
  //
  // Padrão FACADE: nada é carregado do YouTube enquanto o usuário não clica.
  // Antes do play, esta caixinha é só um botão local — ZERO rede, nenhum
  // cookie, nenhum contato com terceiros. O <iframe> (e portanto o player
  // do Google) só é injetado no DOM após o clique explícito — privacy by
  // default, opt-in para abrir a exceção. "Parar" remove o iframe e corta
  // o stream de novo.
  const VIDEO_ID = 'E2vONfzoyRI';
  // O YouTube valida o embed pelo cabeçalho Referer. Como o app usa
  // `referrer: no-referrer` globalmente (index.html), sem reenviar a origem
  // o player devolve "erro 153". Por isso: &origin aqui + referrerpolicy
  // explícito no <iframe> (que só vaza a origem, nada de path/query).
  const ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
  const EMBED_SRC =
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID}` +
    `?autoplay=1&rel=0&modestbranding=1&playsinline=1` +
    (ORIGIN ? `&origin=${encodeURIComponent(ORIGIN)}` : '');

  let playing = $state(false);
</script>

<div data-shortcut="lofi">
<Panel title="Lo-Fi" figure="rádio para focar">
  {#if !playing}
    <button class="facade" onclick={() => (playing = true)} aria-label="Tocar rádio Lo-Fi — carrega do YouTube só agora">
      <span class="disc" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <!-- arco do fone -->
          <path d="M13 41 V32 a19 19 0 0 1 38 0 V41" />
          <!-- conchas -->
          <rect x="8.5" y="38" width="11.5" height="18" rx="5" fill="currentColor" stroke="none" opacity="0.9" />
          <rect x="44" y="38" width="11.5" height="18" rx="5" fill="currentColor" stroke="none" opacity="0.9" />
        </svg>
      </span>
      <span class="cta">
        <strong>tocar live</strong>
        <small>Carrega-se o Youtube somente ao clicar</small>
      </span>
    </button>
  {:else}
    <div class="player">
      <div class="frame">
        <iframe
          title="Lo-Fi hip hop radio"
          src={EMBED_SRC}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin"
          loading="lazy"
        ></iframe>
      </div>
      <button class="stop" onclick={() => (playing = false)}>
        parar
      </button>
    </div>
  {/if}
</Panel>
</div>

<style>
  /* ── Facade: só um botão local, sem rede ── */
  .facade {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    padding: var(--space-4) var(--space-3);
    text-align: left;
    border-radius: var(--r-3);
    color: var(--fg-soft);
    transition: background 160ms ease, color 160ms ease, transform 80ms ease;
  }
  .facade:hover { background: var(--bg-elev); color: var(--fg); }
  .facade:active { transform: translateY(1px); }
  .facade:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  .disc {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    color: var(--accent-deep);
  }
  .disc svg { width: 100%; height: 100%; }

  .cta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .cta strong {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 500;
    font-size: 17px;
    color: var(--fg);
  }
  .cta small {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: var(--tracking-wide);
    color: var(--fg-faint);
  }

  /* ── Player: iframe responsivo 16:9 ── */
  .player {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--r-3);
    overflow: hidden;
    background: var(--bg-sunk);
    border: 1px solid var(--rule);
  }
  .frame iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
  .stop {
    align-self: flex-start;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    color: var(--fg-faint);
    padding: 6px 10px;
    border-radius: var(--r-2);
    transition: background 140ms ease, color 140ms ease;
  }
  .stop:hover { background: var(--bg-elev); color: var(--fg); }
  .stop:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
