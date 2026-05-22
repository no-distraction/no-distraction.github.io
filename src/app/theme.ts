import type { EventBus, NamespacedStorage, Theme } from '$core/types';

const STORAGE_KEY = 'theme';

export class ThemeController {
  current: Theme = 'light';

  constructor(private storage: NamespacedStorage, private bus: EventBus) {}

  async init(): Promise<void> {
    const stored = await this.storage.get<Theme>(STORAGE_KEY);
    if (stored) {
      this.current = stored;
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      this.current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    this.apply();
  }

  async toggle(): Promise<void> {
    this.current = this.current === 'light' ? 'dark' : 'light';
    this.apply();
    await this.storage.set(STORAGE_KEY, this.current);
    this.bus.emit('theme:changed', { theme: this.current });
  }

  async set(theme: Theme): Promise<void> {
    if (this.current === theme) return;
    this.current = theme;
    this.apply();
    await this.storage.set(STORAGE_KEY, this.current);
    this.bus.emit('theme:changed', { theme: this.current });
  }

  private apply(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = this.current;
    document.documentElement.style.colorScheme = this.current;
  }
}
