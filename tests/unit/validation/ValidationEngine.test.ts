import { describe, expect, it, beforeEach } from 'vitest';
import { ValidationEngine } from '../../../src/validation/ValidationEngine.js';

describe('ValidationEngine', () => {
  let form: HTMLFormElement;
  let engine: ValidationEngine;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    document.body.appendChild(form);
    engine = new ValidationEngine();
  });

  it('validates single field', () => {
    form.innerHTML = `
      <input name="email" value="" data-val="true" data-val-required="Email is required" />
      <span data-valmsg-for="email"></span>
    `;
    
    const input = form.querySelector('input') as HTMLInputElement;
    const result = engine.validateField(input);
    
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Email is required');
  });

  it('validates entire form', () => {
    form.innerHTML = `
      <input name="name" value="" data-val="true" data-val-required="Name required" />
      <span data-valmsg-for="name"></span>
      <input name="email" value="" data-val="true" data-val-required="Email required" />
      <span data-valmsg-for="email"></span>
    `;
    
    const result = engine.validateForm(form);
    
    expect(result.isValid).toBe(false);
    expect(result.messages.length).toBe(2);
  });

  it('skips fields where shouldValidate is false', () => {
    form.innerHTML = `
      <input name="visible" value="" data-val="true" data-val-required="Required" />
      <input name="hidden" value="" data-val="true" data-val-required="Required" style="display:none" />
    `;
    
    const result = engine.validateForm(form);
    
    // Only visible field should be validated
    expect(result.messages.length).toBe(1);
  });

  it('runs all validators for a field', () => {
    form.innerHTML = `
      <input name="email" value="ab" 
        data-val="true" 
        data-val-required="Required"
        data-val-minlength="Min 5 chars"
        data-val-minlength-min="5" />
    `;
    
    const input = form.querySelector('input') as HTMLInputElement;
    const result = engine.validateField(input);
    
    // Should fail minlength
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Min 5 chars');
  });

  it('stops on first error by default', () => {
    form.innerHTML = `
      <input name="email" value="" 
        data-val="true" 
        data-val-required="Required"
        data-val-email="Invalid email" />
    `;
    
    const input = form.querySelector('input') as HTMLInputElement;
    const result = engine.validateField(input);
    
    // Should stop at required, not check email
    expect(result.message).toBe('Required');
  });

  it('returns valid for valid field', () => {
    form.innerHTML = `
      <input name="email" value="test@example.com" 
        data-val="true" 
        data-val-required="Required"
        data-val-email="Invalid email" />
    `;
    
    const input = form.querySelector('input') as HTMLInputElement;
    const result = engine.validateField(input);
    
    expect(result.isValid).toBe(true);
  });

  it('returns valid for form with all valid fields', () => {
    form.innerHTML = `
      <input name="name" value="John" data-val="true" data-val-required="Required" />
      <input name="email" value="john@example.com" data-val="true" data-val-required="Required" />
    `;
    
    const result = engine.validateForm(form);
    
    expect(result.isValid).toBe(true);
    expect(result.messages.length).toBe(0);
  });

  it('displays errors when showErrors is true', () => {
    form.innerHTML = `
      <input name="email" value="" data-val="true" data-val-required="Required" />
      <span data-valmsg-for="email"></span>
    `;
    
    engine.validateForm(form, { showErrors: true });
    
    const span = form.querySelector('[data-valmsg-for="email"]');
    expect(span?.textContent).toBe('Required');
  });

  it('clears errors when field becomes valid', () => {
    form.innerHTML = `
      <input name="email" value="" data-val="true" data-val-required="Required" />
      <span data-valmsg-for="email" class="field-validation-error">Required</span>
    `;
    
    const input = form.querySelector('input') as HTMLInputElement;
    input.value = 'test@example.com';
    
    engine.validateField(input, { showErrors: true });
    
    const span = form.querySelector('[data-valmsg-for="email"]');
    expect(span?.textContent).toBe('');
  });
});

