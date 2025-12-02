import { describe, expect, it } from 'vitest';
import { clearErrors, displayErrors } from '../../../src/validation/display.js';

describe('validation/display', () => {
  it('renders and clears validation messages', () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <input name="email" />
      <span data-valmsg-for="email"></span>
    `;

    displayErrors(form, { errors: { email: ['Required'] } });
    expect(form.querySelector('[data-valmsg-for="email"]')?.textContent).toBe('Required');
    expect(form.querySelector('[name="email"]')?.getAttribute('aria-invalid')).toBe('true');

    clearErrors(form);
    expect(form.querySelector('[data-valmsg-for="email"]')?.textContent).toBe('');
    expect(form.querySelector('[name="email"]')?.hasAttribute('aria-invalid')).toBe(false);
  });
});

