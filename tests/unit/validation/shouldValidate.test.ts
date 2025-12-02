import { describe, expect, it, beforeEach } from 'vitest';
import { shouldValidate } from '../../../src/validation/utils/shouldValidate.js';

describe('shouldValidate', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    document.body.appendChild(form);
  });

  it('returns true for visible input', () => {
    const input = document.createElement('input');
    input.setAttribute('data-val', 'true');
    form.appendChild(input);
    
    expect(shouldValidate(input)).toBe(true);
  });

  it('returns false for display:none input', () => {
    const input = document.createElement('input');
    input.setAttribute('data-val', 'true');
    input.style.display = 'none';
    form.appendChild(input);
    
    expect(shouldValidate(input)).toBe(false);
  });

  it('returns false for type="hidden" input', () => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.setAttribute('data-val', 'true');
    form.appendChild(input);
    
    expect(shouldValidate(input)).toBe(false);
  });

  it('returns false for visibility:hidden input', () => {
    const input = document.createElement('input');
    input.setAttribute('data-val', 'true');
    input.style.visibility = 'hidden';
    form.appendChild(input);
    
    expect(shouldValidate(input)).toBe(false);
  });

  it('returns true when data-val-always="true" overrides hidden', () => {
    const input = document.createElement('input');
    input.setAttribute('data-val', 'true');
    input.setAttribute('data-val-always', 'true');
    input.style.display = 'none';
    form.appendChild(input);
    
    expect(shouldValidate(input)).toBe(true);
  });

  it('returns false for disabled input', () => {
    const input = document.createElement('input');
    input.setAttribute('data-val', 'true');
    input.disabled = true;
    form.appendChild(input);
    
    expect(shouldValidate(input)).toBe(false);
  });

  it('returns true for readonly input', () => {
    const input = document.createElement('input');
    input.setAttribute('data-val', 'true');
    input.readOnly = true;
    form.appendChild(input);
    
    expect(shouldValidate(input)).toBe(true);
  });

  it('returns true for Syncfusion hidden input with visible wrapper', () => {
    // Syncfusion renders hidden input + visible wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'e-input-group';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.setAttribute('data-val', 'true');
    
    wrapper.appendChild(input);
    form.appendChild(wrapper);
    
    expect(shouldValidate(input)).toBe(true);
  });

  it('returns false for Syncfusion hidden input with hidden wrapper', () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'e-input-group';
    wrapper.style.display = 'none';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.setAttribute('data-val', 'true');
    
    wrapper.appendChild(input);
    form.appendChild(wrapper);
    
    expect(shouldValidate(input)).toBe(false);
  });

  it('returns false when data-val is not "true"', () => {
    const input = document.createElement('input');
    input.setAttribute('data-val', 'false');
    form.appendChild(input);
    
    expect(shouldValidate(input)).toBe(false);
  });
});

