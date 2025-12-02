import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FieldTriggers } from '../../../../src/validation/triggers/FieldTriggers.js';

describe('FieldTriggers', () => {
  let form: HTMLFormElement;
  let input: HTMLInputElement;
  let triggers: FieldTriggers;
  let onValidate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    input = document.createElement('input');
    input.name = 'email';
    input.setAttribute('data-val', 'true');
    form.appendChild(input);
    document.body.appendChild(form);
    
    onValidate = vi.fn();
    triggers = new FieldTriggers(onValidate);
  });

  it('validates on blur (first touch)', () => {
    triggers.attach(form);
    
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    
    expect(onValidate).toHaveBeenCalledWith(input);
  });

  it('re-validates on input if field has error', () => {
    triggers.attach(form);
    triggers.markAsInvalid(input);
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    expect(onValidate).toHaveBeenCalledWith(input);
  });

  it('does NOT validate on input if field has no error', () => {
    triggers.attach(form);
    // Field is pristine, no error
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    expect(onValidate).not.toHaveBeenCalled();
  });

  it('tracks touched state per field', () => {
    triggers.attach(form);
    
    expect(triggers.isTouched(input)).toBe(false);
    
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    
    expect(triggers.isTouched(input)).toBe(true);
  });

  it('markAsValid clears invalid state', () => {
    triggers.attach(form);
    triggers.markAsInvalid(input);
    
    expect(triggers.isInvalid(input)).toBe(true);
    
    triggers.markAsValid(input);
    
    expect(triggers.isInvalid(input)).toBe(false);
  });

  it('debounces rapid input events', async () => {
    vi.useFakeTimers();
    triggers = new FieldTriggers(onValidate, { debounceMs: 100 });
    triggers.attach(form);
    triggers.markAsInvalid(input);
    
    // Rapid typing
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    expect(onValidate).not.toHaveBeenCalled();
    
    await vi.advanceTimersByTime(100);
    
    expect(onValidate).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('detaches event listeners', () => {
    triggers.attach(form);
    triggers.detach(form);
    
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    
    expect(onValidate).not.toHaveBeenCalled();
  });

  it('only triggers for fields with data-val', () => {
    const plainInput = document.createElement('input');
    plainInput.name = 'plain';
    form.appendChild(plainInput);
    
    triggers.attach(form);
    
    plainInput.dispatchEvent(new Event('blur', { bubbles: true }));
    
    expect(onValidate).not.toHaveBeenCalled();
  });

  it('reset clears all state', () => {
    triggers.attach(form);
    triggers.markAsInvalid(input);
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    
    triggers.reset();
    
    expect(triggers.isTouched(input)).toBe(false);
    expect(triggers.isInvalid(input)).toBe(false);
  });
});

