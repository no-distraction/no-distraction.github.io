import type { AppModule } from '$core/types';

const exercise: AppModule = {
  id: 'exercise',
  publishes: ['exercise:toggled'] as const,
  subscribes: ['day:selected', 'data:imported', 'data:cleared'] as const,
  async init() {
    /* gerenciado pelo componente */
  },
};

export default exercise;
