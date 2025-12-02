import { describe, expect, it } from 'vitest';
import { applyEffects } from '../../../src/state/apply.js';

describe('state/apply', () => {
  it('applies disabled state and aria-busy', () => {
    const button = document.createElement('button');
    applyEffects(button, { indicator: 'is-loading' });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.classList.contains('is-loading')).toBe(true);
  });
});

