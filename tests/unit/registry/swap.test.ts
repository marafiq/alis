import { afterEach, describe, expect, it } from 'vitest';
import { clearSwapStrategies, getSwapStrategy, listSwapStrategies, registerSwapStrategy } from '../../../src/registry/swap.js';

describe('registry/swap', () => {
  afterEach(() => {
    clearSwapStrategies();
  });

  it('includes built-in strategies', () => {
    expect(listSwapStrategies()).toEqual(['innerHTML', 'outerHTML', 'none']);
  });

  it('registers custom strategies', () => {
    const custom = () => null;
    registerSwapStrategy('custom', custom);
    expect(getSwapStrategy('custom')).toBe(custom);
  });

  it('throws for unknown strategies', () => {
    expect(() => getSwapStrategy('missing')).toThrow();
  });
});

