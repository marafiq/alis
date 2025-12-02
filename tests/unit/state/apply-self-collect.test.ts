import { describe, expect, it, beforeEach } from 'vitest';
import { applyEffects } from '../../../src/state/apply.js';

describe('applyEffects with debounce', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should NOT disable input element when debounced', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    document.body.appendChild(input);

    // When debounced, the input should NOT be disabled (user still typing)
    applyEffects(input, { debounced: true });

    expect(input.disabled).toBe(false);
    expect(input.getAttribute('aria-busy')).toBe('true');
  });

  it('should NOT disable button element when debounced', () => {
    const button = document.createElement('button');
    button.textContent = 'Submit';
    document.body.appendChild(button);

    // Debounced buttons should NOT be disabled either
    applyEffects(button, { debounced: true });

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('should disable button element when NOT debounced', () => {
    const button = document.createElement('button');
    button.textContent = 'Submit';
    document.body.appendChild(button);

    // Non-debounced buttons SHOULD be disabled
    applyEffects(button, {});

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('should disable input element when NOT debounced', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    document.body.appendChild(input);

    // Non-debounced inputs SHOULD be disabled
    applyEffects(input, {});

    expect(input.disabled).toBe(true);
  });

  it('should NOT disable select element when debounced', () => {
    const select = document.createElement('select');
    select.name = 'country';
    select.innerHTML = '<option value="US">USA</option>';
    document.body.appendChild(select);

    applyEffects(select, { debounced: true });

    expect(select.disabled).toBe(false);
    expect(select.getAttribute('aria-busy')).toBe('true');
  });

  it('should NOT disable textarea element when debounced', () => {
    const textarea = document.createElement('textarea');
    textarea.name = 'message';
    document.body.appendChild(textarea);

    applyEffects(textarea, { debounced: true });

    expect(textarea.disabled).toBe(false);
    expect(textarea.getAttribute('aria-busy')).toBe('true');
  });

  it('should still show indicator when debounced', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);

    applyEffects(input, { debounced: true, indicator: 'is-loading' });

    expect(input.disabled).toBe(false);
    expect(input.classList.contains('is-loading')).toBe(true);
  });
});

