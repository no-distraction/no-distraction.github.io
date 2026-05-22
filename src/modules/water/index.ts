import type { AppModule } from '$core/types';

const water: AppModule = {
  id: 'water',
  publishes: ['water:check-toggled', 'water:goal-met', 'water:config-changed'] as const,
  subscribes: ['day:selected', 'data:imported', 'data:cleared'] as const,
  async init() {
    /* gerenciado pelo componente */
  },
};

export default water;
