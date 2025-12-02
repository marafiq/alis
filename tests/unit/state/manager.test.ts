import { describe, expect, it } from 'vitest';
import { createStateManager } from '../../../src/state/manager.js';

describe('state/manager', () => {
  it('captures and restores', () => {
    const button = document.createElement('button');
    button.textContent = 'Save';
    const manager = createStateManager(button, { indicator: 'is-loading' });

    manager.apply();
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('is-loading')).toBe(true);

    manager.restore();
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('is-loading')).toBe(false);
  });
});

