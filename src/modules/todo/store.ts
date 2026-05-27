import type { DateKey, NamespacedStorage } from '$core/types';

export type Task = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
};

const KEY = (date: DateKey) => `tasks:${date}`;

export class TodoStore {
  /**
   * Fila de escrita serial — evita "The transaction has finished" do IndexedDB
   * quando o usuário cria/edita tarefas em ritmo rápido (múltiplos setItem
   * concorrentes ao mesmo tempo confundem a transação do localForage).
   */
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(private storage: NamespacedStorage) {}

  async listByDay(date: DateKey): Promise<Task[]> {
    const list = await this.storage.get<Task[]>(KEY(date));
    return Array.isArray(list) ? list : [];
  }

  async write(date: DateKey, tasks: Task[]): Promise<void> {
    const next = this.writeQueue
      .catch(() => {}) // não deixa um erro anterior quebrar a cadeia
      .then(async () => {
        if (tasks.length === 0) {
          await this.storage.remove(KEY(date));
        } else {
          await this.storage.set(KEY(date), tasks);
        }
      });
    this.writeQueue = next;
    return next;
  }
}
