import { describe, expect, it } from 'vitest';
import { validationDisplayStep } from '../../../../src/pipeline/steps/validation-display.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/validation-display', () => {
  it('clears errors when none present', () => {
    const form = document.createElement('form');
    form.innerHTML = '<span data-valmsg-for="email">Error</span>';
    const ctx = createContext(form);
    validationDisplayStep(ctx);
    expect(form.querySelector('[data-valmsg-for="email"]')?.textContent).toBe('');
  });

  it('displays validation errors', () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <input name="email" />
      <span data-valmsg-for="email"></span>
    `;
    const ctx = createContext(form);
    ctx.validation = { errors: { email: ['Required'] } };

    validationDisplayStep(ctx);

    expect(form.querySelector('[data-valmsg-for="email"]')?.textContent).toBe('Required');
  });
});

