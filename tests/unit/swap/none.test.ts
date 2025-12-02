import { describe, expect, it } from 'vitest';
import { swap } from '../../../src/swap/none.js';

describe('swap/none', () => {
  it('returns target without modifying DOM', () => {
    const target = document.createElement('div');
    target.textContent = 'keep';
    const result = swap(target);
    expect(result).toBe(target);
    expect(target.textContent).toBe('keep');
  });
});

