import type { AppModule } from '$core/types';

const lofi: AppModule = {
  id: 'lofi',
  // Sem estado persistente e sem rede até o clique (padrão facade).
  publishes: [] as const,
  subscribes: [] as const,
  async init() {
    /* gerenciado pelo componente */
  },
};

export default lofi;
