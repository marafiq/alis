import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  emit,
  getAdapters,
  getLevel,
  addAdapter,
  removeAdapter,
  setLevel,
  startSpan,
  endSpan,
  createConsoleAdapter,
  createCallbackAdapter,
  createBufferAdapter,
  _resetTelemetry
} from '../../../src/telemetry/emitter.js';

describe('telemetry/emitter', () => {
  afterEach(() => {
    _resetTelemetry();
  });

  describe('emit', () => {
    it('ignores events when level is none', () => {
      const adapter = { emit: vi.fn() };
      addAdapter(adapter);
      setLevel('none');
      const result = emit('request:start', { id: '1' });
      expect(result).toBe(false);
      expect(adapter.emit).not.toHaveBeenCalled();
    });

    it('emits events when level threshold satisfied', () => {
      const adapter = { emit: vi.fn() };
      addAdapter(adapter);
      setLevel('debug');

      const payload = emit('trigger', { id: '1' });

      expect(adapter.emit).toHaveBeenCalledWith('trigger', expect.objectContaining({
        event: 'trigger',
        level: 'debug',
        data: { id: '1' }
      }));
      expect(payload).toHaveProperty('timestamp');
    });

    it('returns false for empty event name', () => {
      const result = emit('', {});
      expect(result).toBe(false);
    });

    it('emits to multiple adapters', () => {
      const adapter1 = { emit: vi.fn() };
      const adapter2 = { emit: vi.fn() };
      addAdapter(adapter1);
      addAdapter(adapter2);
      setLevel('info');

      emit('test:event', { data: 'value' });

      expect(adapter1.emit).toHaveBeenCalled();
      expect(adapter2.emit).toHaveBeenCalled();
    });

    it('honors level overrides', () => {
      const adapter = { emit: vi.fn() };
      addAdapter(adapter);
      setLevel('warn');

      const payload = emit('custom:event', { foo: true }, { level: 'error' });

      expect(payload).not.toBe(false);
      expect(adapter.emit).toHaveBeenCalledWith('custom:event', expect.objectContaining({
        level: 'error'
      }));
    });
  });

  describe('adapters', () => {
    it('validates adapter structure', () => {
      expect(() => addAdapter(null as any)).toThrow(TypeError);
      expect(() => addAdapter({} as any)).toThrow(TypeError);
    });

    it('prevents duplicate adapters', () => {
      const adapter = { emit: vi.fn() };
      addAdapter(adapter);
      addAdapter(adapter);
      expect(getAdapters()).toHaveLength(1);
    });

    it('removes adapter', () => {
      const adapter = { emit: vi.fn() };
      addAdapter(adapter);
      expect(getAdapters()).toHaveLength(1);
      removeAdapter(adapter);
      expect(getAdapters()).toHaveLength(0);
    });

    it('handles removing non-existent adapter', () => {
      const adapter = { emit: vi.fn() };
      expect(() => removeAdapter(adapter)).not.toThrow();
    });
  });

  describe('levels', () => {
    it('rejects unknown levels', () => {
      expect(() => setLevel('verbose' as any)).toThrow();
    });

    it('exposes current level', () => {
      setLevel('info');
      expect(getLevel()).toBe('info');
    });
  });

  describe('spans', () => {
    it('creates span with start time', () => {
      const span = startSpan('request', { url: '/api' });
      expect(span.name).toBe('request');
      expect(span.startTime).toBeGreaterThan(0);
      expect(span.attributes).toEqual({ url: '/api' });
    });

    it('emits start event', () => {
      const adapter = { emit: vi.fn() };
      addAdapter(adapter);
      setLevel('debug');

      startSpan('request', { url: '/api' });

      expect(adapter.emit).toHaveBeenCalledWith('request:start', expect.objectContaining({
        data: { url: '/api' }
      }));
    });

    it('emits end event with duration', () => {
      const adapter = { emit: vi.fn() };
      addAdapter(adapter);
      setLevel('debug');

      const span = startSpan('request', { url: '/api' });
      endSpan(span, { status: 200 });

      expect(adapter.emit).toHaveBeenCalledWith('request:end', expect.objectContaining({
        data: expect.objectContaining({
          url: '/api',
          status: 200,
          durationMs: expect.any(Number)
        })
      }));
    });
  });

  describe('adapter factories', () => {
    it('createConsoleAdapter logs to console', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const adapter = createConsoleAdapter();
      addAdapter(adapter);
      setLevel('info');

      emit('test', { value: 1 });

      expect(consoleSpy).toHaveBeenCalledWith('[ALIS:test]', { value: 1 });
      consoleSpy.mockRestore();
    });

    it('createCallbackAdapter calls callback', () => {
      const callback = vi.fn();
      const adapter = createCallbackAdapter(callback);
      addAdapter(adapter);
      setLevel('info');

      emit('test', { value: 1 });

      expect(callback).toHaveBeenCalledWith('test', expect.objectContaining({
        event: 'test'
      }));
    });

    it('createBufferAdapter stores events', () => {
      const adapter = createBufferAdapter(10);
      addAdapter(adapter);
      setLevel('info');

      emit('event1', {});
      emit('event2', {});

      const events = adapter.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].event).toBe('event1');
      expect(events[1].event).toBe('event2');
    });

    it('createBufferAdapter respects max size', () => {
      const adapter = createBufferAdapter(2);
      addAdapter(adapter);
      setLevel('info');

      emit('event1', {});
      emit('event2', {});
      emit('event3', {});

      const events = adapter.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].event).toBe('event2');
      expect(events[1].event).toBe('event3');
    });

    it('createBufferAdapter clears events', () => {
      const adapter = createBufferAdapter();
      addAdapter(adapter);
      setLevel('info');

      emit('event', {});
      adapter.clear();

      expect(adapter.getEvents()).toHaveLength(0);
    });
  });
});
