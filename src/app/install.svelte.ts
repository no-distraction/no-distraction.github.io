/*
 * Instalação do PWA — controla quando o prompt aparece, em vez de deixar o
 * navegador mostrar o mini-infobar nativo uma única vez (que, recusado, some
 * para sempre). Capturamos o `beforeinstallprompt`, guardamos o evento e só
 * disparamos quando o usuário clica no nosso botão.
 *
 * iOS/Safari não tem `beforeinstallprompt`: a instalação é manual via
 * "Compartilhar → Adicionar à Tela de Início". Para esse caso expomos
 * `isIOS` e o botão mostra as instruções.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

export const install = $state({
  /** Android / Chromium: `beforeinstallprompt` capturado e pronto pra disparar. */
  canPrompt: false,
  /** iOS/Safari: precisa do fluxo manual de "Adicionar à Tela de Início". */
  isIOS: false,
  /** Já roda instalado (standalone) — nada a oferecer. */
  installed: false,
});

let deferred: BeforeInstallPromptEvent | null = null;

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    // iOS marca apps na tela de início com esta flag não-padrão.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectIOS(): boolean {
  const ua = navigator.userAgent;
  const iDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se passa por Mac; distinguimos pelo touch.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iDevice || iPadOS;
}

export function initInstall(): void {
  if (typeof window === 'undefined') return;

  if (isStandalone()) {
    install.installed = true;
    return;
  }

  install.isIOS = detectIOS();

  window.addEventListener('beforeinstallprompt', (e) => {
    // Impede o mini-infobar — nós controlamos o momento via botão.
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    install.canPrompt = true;
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    install.canPrompt = false;
    install.installed = true;
  });
}

/** Dispara o prompt nativo (Android/Chromium). O evento só serve uma vez. */
export async function promptInstall(): Promise<InstallOutcome> {
  if (!deferred) return 'unavailable';
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  install.canPrompt = false; // consumido; reaparece no próximo beforeinstallprompt elegível
  return outcome;
}
