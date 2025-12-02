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

  it('validates adapter structure', () => {
    expect(() => setAdapter(null as any)).toThrow(TypeError);
  });

  it('rejects unknown levels', () => {
    expect(() => setLevel('verbose' as any)).toThrow();
  });

  it('exposes accessors for debugging', () => {
    setLevel('info');
    expect(getLevel()).toBe('info');
    expect(typeof getAdapter()).toBe('object');
  });
});

