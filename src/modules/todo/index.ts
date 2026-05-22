import type { AppModule } from '$core/types';

const todo: AppModule = {
  id: 'todo',
  publishes: ['task:created', 'task:completed', 'task:uncompleted', 'task:deleted', 'task:count-changed'] as const,
  subscribes: ['day:selected', 'data:imported', 'data:cleared', 'task:created', 'task:completed', 'task:uncompleted', 'task:deleted'] as const,
  async init() {
    /* O componente Svelte gerencia o ciclo de vida e usa rootStorage namespaced. */
  },
};

export default todo;
