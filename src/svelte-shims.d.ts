/// <reference types="svelte" />
/// <reference types="vite/client" />
declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}
declare module 'virtual:pwa-register/svelte' {
  export function useRegisterSW(opts?: {
    onRegistered?(r: ServiceWorkerRegistration | undefined): void;
    onRegisterError?(error: unknown): void;
    onNeedRefresh?(): void;
    onOfflineReady?(): void;
  }): {
    needRefresh: { subscribe: (run: (v: boolean) => void) => () => void };
    offlineReady: { subscribe: (run: (v: boolean) => void) => () => void };
    updateServiceWorker: (reload?: boolean) => Promise<void>;
  };
}
