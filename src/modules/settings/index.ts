import type { AppModule } from '$core/types';

const settings: AppModule = {
  id: 'settings',
  publishes: ['theme:changed', 'data:imported', 'data:cleared', 'water:config-changed', 'pomodoro:config-changed'] as const,
  subscribes: [] as const,
  async init() {
    /* O Settings é montado dentro do Modal pela própria App, então não há trabalho aqui. */
  },
};

export default settings;
