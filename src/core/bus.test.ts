import { describe, expect, it, vi } from 'vitest';
import { createBus } from './bus';

describe('event bus', () => {
  it('delivers events to subscribers', () => {
    const bus = createBus();
    const fn = vi.fn();
    bus.on('day:selected', fn);
    bus.emit('day:selected', { date: '2026-01-01' });
    expect(fn).toHaveBeenCalledWith({ date: '2026-01-01' });
  });

  it('unsubscribes via returned dispose', () => {
    const bus = createBus();
    const fn = vi.fn();
    const off = bus.on('day:selected', fn);
    off();
    bus.emit('day:selected', { date: '2026-01-01' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('isolates handler errors', () => {
    const bus = createBus();
    const a = vi.fn(() => {
      throw new Error('boom');
    });
    const b = vi.fn();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    bus.on('day:selected', a);
    bus.on('day:selected', b);
    bus.emit('day:selected', { date: '2026-01-01' });
    expect(b).toHaveBeenCalled();
    spy.mockRestore();
  });
});
