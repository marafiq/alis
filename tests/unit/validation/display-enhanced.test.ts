import { describe, expect, it, beforeEach } from 'vitest';
import { clearErrors, displayErrors } from '../../../src/validation/display.js';

describe('validation/display enhanced', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    document.body.appendChild(form);
  });

  it('finds span with case-insensitive match', () => {
    form.innerHTML = `
      <input name="employee.firstname" />
      <span data-valmsg-for="employee.firstname"></span>
    `;

    // Server returns PascalCase, HTML has lowercase
    displayErrors(form, { 
      errors: { 'Employee.FirstName': ['First name is required'] } 
    });

    const span = form.querySelector('[data-valmsg-for="employee.firstname"]');
    expect(span?.textContent).toBe('First name is required');
  });

  it('finds input with case-insensitive match for aria-invalid', () => {
    form.innerHTML = `
      <input name="employee.firstname" />
      <span data-valmsg-for="employee.firstname"></span>
    `;

    displayErrors(form, { 
      errors: { 'Employee.FirstName': ['Required'] } 
    });

    const input = form.querySelector('input');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
  });

  it('handles nested field names with dot notation', () => {
    form.innerHTML = `
      <input name="Employee.Address.City" />
      <span data-valmsg-for="Employee.Address.City"></span>
    `;

    displayErrors(form, { 
      errors: { 'Employee.Address.City': ['City is required'] } 
    });

    const span = form.querySelector('[data-valmsg-for="Employee.Address.City"]');
    expect(span?.textContent).toBe('City is required');
  });

  it('handles array notation in field names', () => {
    form.innerHTML = `
      <input name="Contacts[0].Email" />
      <span data-valmsg-for="Contacts[0].Email"></span>
    `;

    displayErrors(form, { 
      errors: { 'Contacts[0].Email': ['Invalid email format'] } 
    });

    const span = form.querySelector('[data-valmsg-for="Contacts[0].Email"]');
    expect(span?.textContent).toBe('Invalid email format');
  });

  it('adds field-validation-error class to span', () => {
    form.innerHTML = `
      <input name="email" />
      <span data-valmsg-for="email" class="field-validation-valid"></span>
    `;

    displayErrors(form, { 
      errors: { email: ['Required'] } 
    });

    const span = form.querySelector('[data-valmsg-for="email"]');
    expect(span?.classList.contains('field-validation-error')).toBe(true);
    expect(span?.classList.contains('field-validation-valid')).toBe(false);
  });

  it('adds input-validation-error class to input', () => {
    form.innerHTML = `
      <input name="email" class="input-validation-valid" />
      <span data-valmsg-for="email"></span>
    `;

    displayErrors(form, { 
      errors: { email: ['Required'] } 
    });

    const input = form.querySelector('input');
    expect(input?.classList.contains('input-validation-error')).toBe(true);
    expect(input?.classList.contains('input-validation-valid')).toBe(false);
  });

  it('clears error classes on clearErrors', () => {
    form.innerHTML = `
      <input name="email" class="input-validation-error" aria-invalid="true" />
      <span data-valmsg-for="email" class="field-validation-error">Error message</span>
    `;

    clearErrors(form);

    const span = form.querySelector('[data-valmsg-for="email"]');
    const input = form.querySelector('input');
    
    expect(span?.textContent).toBe('');
    expect(span?.classList.contains('field-validation-error')).toBe(false);
    expect(span?.classList.contains('field-validation-valid')).toBe(true);
    
    expect(input?.hasAttribute('aria-invalid')).toBe(false);
    expect(input?.classList.contains('input-validation-error')).toBe(false);
    expect(input?.classList.contains('input-validation-valid')).toBe(true);
  });
});

