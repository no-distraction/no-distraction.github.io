import type { AppModule } from '$core/types';

const meals: AppModule = {
  id: 'meals',
  publishes: ['meals:check-toggled', 'meals:all-done'] as const,
  subscribes: ['day:selected', 'data:imported', 'data:cleared'] as const,
  async init() {
    /* gerenciado pelo componente */
  },
};

export default meals;
