import { describe, expect, it } from 'vitest';
import { swap } from '../../../src/swap/outer-html.js';

describe('swap/outer-html', () => {
  it('replaces the entire element', () => {
    const target = document.createElement('div');
    target.innerHTML = 'old';
    document.body.appendChild(target);

    const result = swap(target, '<section>new</section>');

    expect(result.tagName.toLowerCase()).toBe('section');
    expect(document.body.contains(result)).toBe(true);
  });
});

