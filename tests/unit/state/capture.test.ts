import { describe, expect, it } from 'vitest';
import { captureState } from '../../../src/state/capture.js';

describe('state/capture', () => {
  it('captures button state', () => {
    const button = document.createElement('button');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('loading');

    const state = captureState(button);
    expect(state.disabled).toBe(true);
    expect(state.ariaBusy).toBe('true');
    expect(state.classList).toContain('loading');
  });
});

