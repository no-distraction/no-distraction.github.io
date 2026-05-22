import type { AppModule } from '$core/types';

const notes: AppModule = {
  id: 'notes',
  publishes: ['note:edited'] as const,
  subscribes: ['day:selected', 'data:imported', 'data:cleared'] as const,
  async init() {
    /* gerenciado pelo componente */
  },
};

export default notes;
