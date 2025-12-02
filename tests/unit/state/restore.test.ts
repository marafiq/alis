import { describe, expect, it } from 'vitest';
import { restoreState } from '../../../src/state/restore.js';

describe('state/restore', () => {
  it('restores button state', () => {
    const button = document.createElement('button');
    const state = {
      disabled: false,
      ariaBusy: null,
      classList: [],
      textContent: 'Submit'
    };

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Loading';

    restoreState(button, state);

    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-busy')).toBe(false);
    expect(button.textContent).toBe('Submit');
  });
});

