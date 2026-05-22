import type { AppModule } from '$core/types';

const calendar: AppModule = {
  id: 'calendar',
  publishes: ['day:selected'] as const,
  subscribes: [] as const,
  async init() {
    /* state lives in $app/state */
  },
};

export default calendar;
