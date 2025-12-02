import { describe, expect, it, beforeEach } from 'vitest';
import { ErrorDisplay } from '../../../src/validation/ErrorDisplay.js';

describe('ErrorDisplay', () => {
  let form: HTMLFormElement;
  let display: ErrorDisplay;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    document.body.appendChild(form);
    display = new ErrorDisplay();
  });

  it('shows error message in span', () => {
    form.innerHTML = `
      <input name="email" />
      <span data-valmsg-for="email"></span>
    `;
    
    display.showError(form, 'email', 'Email is required');
    
    const span = form.querySelector('[data-valmsg-for="email"]');
    expect(span?.textContent).toBe('Email is required');
  });

  it('adds error class to span', () => {
    form.innerHTML = `
      <input name="email" />
      <span data-valmsg-for="email" class="field-validation-valid"></span>
    `;
    
    display.showError(form, 'email', 'Error');
    
    const span = form.querySelector('[data-valmsg-for="email"]');
    expect(span?.classList.contains('field-validation-error')).toBe(true);
    expect(span?.classList.contains('field-validation-valid')).toBe(false);
  });

  it('adds error class to input', () => {
    form.innerHTML = `
      <input name="email" class="input-validation-valid" />
      <span data-valmsg-for="email"></span>
    `;
    
    display.showError(form, 'email', 'Error');
    
    const input = form.querySelector('input');
    expect(input?.classList.contains('input-validation-error')).toBe(true);
    expect(input?.classList.contains('input-validation-valid')).toBe(false);
  });

  it('sets aria-invalid on input', () => {
    form.innerHTML = `
      <input name="email" />
      <span data-valmsg-for="email"></span>
    `;
    
    display.showError(form, 'email', 'Error');
    
    const input = form.querySelector('input');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
  });

  it('clears error message on clearError', () => {
    form.innerHTML = `
      <input name="email" class="input-validation-error" aria-invalid="true" />
      <span data-valmsg-for="email" class="field-validation-error">Error</span>
    `;
    
    display.clearError(form, 'email');
    
    const span = form.querySelector('[data-valmsg-for="email"]');
    const input = form.querySelector('input');
    
    expect(span?.textContent).toBe('');
    expect(span?.classList.contains('field-validation-error')).toBe(false);
    expect(span?.classList.contains('field-validation-valid')).toBe(true);
    expect(input?.hasAttribute('aria-invalid')).toBe(false);
    expect(input?.classList.contains('input-validation-error')).toBe(false);
  });

  it('removes error classes on clearError', () => {
    form.innerHTML = `
      <input name="email" class="input-validation-error" />
      <span data-valmsg-for="email" class="field-validation-error"></span>
    `;
    
    display.clearError(form, 'email');
    
    const input = form.querySelector('input');
    expect(input?.classList.contains('input-validation-valid')).toBe(true);
  });

  it('handles Syncfusion wrapper - adds class to visible element', () => {
    form.innerHTML = `
      <div class="e-input-group">
        <input type="hidden" name="dropdown" />
        <input class="e-input" />
      </div>
      <span data-valmsg-for="dropdown"></span>
    `;
    
    display.showError(form, 'dropdown', 'Required');
    
    const wrapper = form.querySelector('.e-input-group');
    expect(wrapper?.classList.contains('e-error')).toBe(true);
  });

  it('handles multiple errors per field', () => {
    form.innerHTML = `
      <input name="email" />
      <span data-valmsg-for="email"></span>
    `;
    
    display.showError(form, 'email', 'Error 1, Error 2');
    
    const span = form.querySelector('[data-valmsg-for="email"]');
    expect(span?.textContent).toBe('Error 1, Error 2');
  });

  it('uses case-insensitive field matching', () => {
    form.innerHTML = `
      <input name="employee.firstname" />
      <span data-valmsg-for="employee.firstname"></span>
    `;
    
    // Server returns PascalCase
    display.showError(form, 'Employee.FirstName', 'Required');
    
    const span = form.querySelector('[data-valmsg-for="employee.firstname"]');
    expect(span?.textContent).toBe('Required');
  });
});

