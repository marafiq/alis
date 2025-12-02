import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, getAdapter, getLevel, setAdapter, setLevel, _resetTelemetry } from '../../../src/telemetry/emitter.js';

describe('telemetry/emitter', () => {
  afterEach(() => {
    _resetTelemetry();
  });

  it('ignores events when level is none', () => {
    const adapter = { emit: vi.fn() };
    setAdapter(adapter);
    setLevel('none');
    const result = emit('request:start', { id: '1' });
    expect(result).toBe(false);
    expect(adapter.emit).not.toHaveBeenCalled();
  });

  it('emits events when level threshold satisfied', () => {
    const adapter = { emit: vi.fn() };
    setAdapter(adapter);
    setLevel('debug');

    const payload = emit('trigger', { id: '1' });

    expect(adapter.emit).toHaveBeenCalledWith('trigger', expect.objectContaining({
      event: 'trigger',
      level: 'debug',
      data: { id: '1' }
    }));
    expect(payload).toHaveProperty('timestamp');
  });

  it('honors per-call level overrides', () => {
    const adapter = { emit: vi.fn() };
    setAdapter(adapter);
    setLevel('warn');

    const payload = emit('custom:event', { foo: true }, { levels: { 'custom:event': 'error' } });

    expect(payload).not.toBe(false);
    expect(adapter.emit).toHaveBeenCalledWith('custom:event', expect.objectContaining({
      level: 'error',
      data: { foo: true }
    }));
  });

  it('throws for invalid event names', () => {
    expect(() => emit('', {})).toThrow(TypeError);
  });

  it('validates adapter structure', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => setAdapter(null as any)).toThrow(TypeError);
  });

  it('rejects unknown levels', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => setLevel('verbose' as any)).toThrow();
  });

  it('exposes accessors for debugging', () => {
    setLevel('info');
    expect(getLevel()).toBe('info');
    expect(typeof getAdapter()).toBe('object');
  });
});

