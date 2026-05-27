import { mount } from 'svelte';
import { createBus } from '$core/bus';
import { rootStorage } from '$core/storage';
import { runMigrations } from '$core/migrations';
import type { AppModule, EventBus } from '$core/types';
import { ThemeController } from './theme';
import { installShortcuts } from './shortcuts';
import { bootstrapIndicators } from './indicators';
import { app } from './state.svelte';
import { initInstall } from './install.svelte';
import App from './App.svelte';

import calendar from '$modules/calendar';
import todo from '$modules/todo';
import notes from '$modules/notes';
import pomodoro from '$modules/pomodoro';
import water from '$modules/water';
import meals from '$modules/meals';
import exercise from '$modules/exercise';
import lofi from '$modules/lofi';

const MODULES: AppModule[] = [calendar, todo, notes, pomodoro, water, meals, exercise, lofi];

export async function bootstrap(target: HTMLElement): Promise<void> {
  const bus: EventBus = createBus();

  // Registra os listeners de instalação cedo — o `beforeinstallprompt` pode
  // disparar antes de as migrações abaixo terminarem.
  initInstall();

  await runMigrations(rootStorage);

  // controller de tema usa o namespace "settings" (mesma chave do módulo Settings)
  const themeStorage = rootStorage.namespaced('settings');
  const theme = new ThemeController(themeStorage, bus);
  await theme.init();

  // contexto compartilhado pelos módulos
  for (const mod of MODULES) {
    const ctx = {
      bus,
      storage: rootStorage.namespaced(mod.id),
      rootStorage,
    };
    await mod.init(ctx);
  }

  await bootstrapIndicators(
    bus,
    rootStorage.namespaced('todo'),
    rootStorage.namespaced('notes'),
  );

  installShortcuts({
    bus,
    togglePomodoro: () => window.dispatchEvent(new CustomEvent('pomodoro:toggle')),
    toggleTheme: () => theme.toggle(),
  });

  app.ready = true;

  mount(App, {
    target,
    props: { bus, theme },
  });
}
