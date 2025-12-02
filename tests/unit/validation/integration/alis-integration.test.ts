import { describe, expect, it, beforeEach } from 'vitest';
import { createValidationStep } from '../../../../src/validation/integration/alis-integration.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('ALIS Validation Integration', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    form.setAttribute('data-alis-post', '/api/submit');
    document.body.appendChild(form);
  });

  it('data-alis-validate="true" enables validation', () => {
    form.setAttribute('data-alis-validate', 'true');
    form.innerHTML = `
      <input name="email" value="" data-val="true" data-val-required="Required" />
      <span data-valmsg-for="email"></span>
    `;
    
    const step = createValidationStep();
    const ctx = createContext(form);
    
    const result = step(ctx);
    
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Validation failed');
  });

  it('prevents form submit if invalid', () => {
    form.setAttribute('data-alis-validate', 'true');
    form.innerHTML = `
      <input name="email" value="" data-val="true" data-val-required="Required" />
    `;
    
    const step = createValidationStep();
    const ctx = createContext(form);
    
    const result = step(ctx);
    
    // Should set error on context
    expect(result.error).toBeDefined();
  });

  it('shows all errors on submit attempt', () => {
    form.setAttribute('data-alis-validate', 'true');
    form.innerHTML = `
      <input name="name" value="" data-val="true" data-val-required="Name required" />
      <span data-valmsg-for="name"></span>
      <input name="email" value="" data-val="true" data-val-required="Email required" />
      <span data-valmsg-for="email"></span>
    `;
    
    const step = createValidationStep();
    const ctx = createContext(form);
    
    step(ctx);
    
    const nameSpan = form.querySelector('[data-valmsg-for="name"]');
    const emailSpan = form.querySelector('[data-valmsg-for="email"]');
    
    expect(nameSpan?.textContent).toBe('Name required');
    expect(emailSpan?.textContent).toBe('Email required');
  });

  it('allows submit if all valid', () => {
    form.setAttribute('data-alis-validate', 'true');
    form.innerHTML = `
      <input name="email" value="test@example.com" data-val="true" data-val-required="Required" />
    `;
    
    const step = createValidationStep();
    const ctx = createContext(form);
    
    const result = step(ctx);
    
    // No error set (null means no error)
    expect(result.error).toBeNull();
  });

  it('respects data-alis-validate="false"', () => {
    form.setAttribute('data-alis-validate', 'false');
    form.innerHTML = `
      <input name="email" value="" data-val="true" data-val-required="Required" />
    `;
    
    const step = createValidationStep();
    const ctx = createContext(form);
    
    const result = step(ctx);
    
    // Should not validate - no error
    expect(result.error).toBeNull();
  });

  it('skips validation when no data-alis-validate attribute', () => {
    // No data-alis-validate attribute
    form.innerHTML = `
      <input name="email" value="" data-val="true" data-val-required="Required" />
    `;
    
    const step = createValidationStep();
    const ctx = createContext(form);
    
    const result = step(ctx);
    
    // Should not validate - no error
    expect(result.error).toBeNull();
  });

  it('works with non-form elements', () => {
    const button = document.createElement('button');
    button.setAttribute('data-alis-post', '/api/submit');
    document.body.appendChild(button);
    
    const step = createValidationStep();
    const ctx = createContext(button);
    
    const result = step(ctx);
    
    // Should not error for non-form elements
    expect(result.error).toBeNull();
  });

  it('server errors still display after validation passes', () => {
    form.setAttribute('data-alis-validate', 'true');
    form.innerHTML = `
      <input name="email" value="test@example.com" data-val="true" data-val-required="Required" />
      <span data-valmsg-for="email"></span>
    `;
    
    const step = createValidationStep();
    const ctx = createContext(form);
    
    // Validation passes
    const result = step(ctx);
    expect(result.error).toBeNull();
    
    // Server error would be handled by responseRouteStep/validationDisplayStep
    // This test just confirms validation doesn't block valid forms
  });
});

