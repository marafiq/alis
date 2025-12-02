import { describe, expect, it } from 'vitest';
import { swap } from '../../../src/swap/inner-html.js';

describe('swap/inner-html', () => {
  it('replaces innerHTML', () => {
    const target = document.createElement('div');
    target.innerHTML = '<p>old</p>';
    const result = swap(target, '<p>new</p>');
    expect(result).toBe(target);
    expect(target.innerHTML).toBe('<p>new</p>');
  });
});

