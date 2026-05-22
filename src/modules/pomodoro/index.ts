import type { AppModule } from '$core/types';

const pomodoro: AppModule = {
  id: 'pomodoro',
  publishes: ['pomodoro:started', 'pomodoro:cycle-completed'] as const,
  subscribes: ['pomodoro:config-changed'] as const,
  async init() {
    /* gerenciado pelo componente */
  },
};

export default pomodoro;
