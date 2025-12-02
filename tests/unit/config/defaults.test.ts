import { describe, expect, it } from 'vitest';
import { ALIS_SELECTOR, DEFAULTS, METHODS } from '../../../src/config/defaults.js';

describe('config/defaults', () => {
  it('exposes allowed HTTP methods', () => {
    expect(METHODS).toEqual(['get', 'post', 'put', 'patch', 'delete']);
    expect(Object.isFrozen(METHODS)).toBe(true);
  });

  it('freezes default configuration deeply', () => {
    expect(Object.isFrozen(DEFAULTS)).toBe(true);
    expect(Object.isFrozen(DEFAULTS.retry)).toBe(true);
  });

  it('defines base selector', () => {
    expect(ALIS_SELECTOR).toBe('[data-alis]');
  });
});

