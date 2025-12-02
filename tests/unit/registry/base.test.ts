import { describe, expect, it } from 'vitest';
import { createRegistry } from '../../../src/registry/base.js';

describe('registry/base', () => {
  it('registers and retrieves entries', () => {
    const registry = createRegistry({ name: 'test' });
    registry.register('alpha', 1);
    expect(registry.get('alpha')).toBe(1);
    expect(registry.has('alpha')).toBe(true);
    expect(registry.keys()).toEqual(['alpha']);
  });

  it('prevents duplicate registration unless overridden', () => {
    const registry = createRegistry();
    registry.register('dup', { value: 1 });
    expect(() => registry.register('dup', { value: 2 })).toThrow();
    registry.register('dup', { value: 3 }, { override: true });
    expect(registry.get('dup')).toEqual({ value: 3 });
  });

  it('validates keys and values', () => {
    const registry = createRegistry();
    expect(() => registry.register('', 1)).toThrow(TypeError);
    expect(() => registry.register('valid', null)).toThrow(TypeError);
  });

  it('clears and unregisters entries', () => {
    const registry = createRegistry();
    registry.register('one', 1);
    registry.register('two', 2);
    registry.unregister('one');
    expect(registry.has('one')).toBe(false);
    registry.clear();
    expect(registry.keys()).toEqual([]);
  });
});

