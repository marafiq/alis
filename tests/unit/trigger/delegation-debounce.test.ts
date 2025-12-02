import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { setupDelegation, teardownDelegation } from '../../../src/trigger/delegation.js';

describe('Delegation with debounce', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    teardownDelegation();
    vi.useRealTimers();
  });

  it('calls onTrigger with correct element after debounce delay', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.setAttribute('data-alis-get', '/api/search');
    input.setAttribute('data-alis-trigger', 'input delay:500ms');
    input.setAttribute('data-alis-collect', 'self');
    document.body.appendChild(input);

    const onTrigger = vi.fn();
    setupDelegation(['input'], onTrigger);

    // Type into the input
    input.value = 'hello';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Should not have called onTrigger yet
    expect(onTrigger).not.toHaveBeenCalled();

    // Fast-forward time past the debounce delay
    vi.advanceTimersByTime(500);

    // Now it should have been called
    expect(onTrigger).toHaveBeenCalledTimes(1);
    
    // Check that the element passed has the correct value
    const [element] = onTrigger.mock.calls[0];
    expect(element).toBe(input);
    expect(element.value).toBe('hello');
  });

  it('element value is current when debounced callback fires', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.setAttribute('data-alis-get', '/api/search');
    input.setAttribute('data-alis-trigger', 'input delay:500ms');
    input.setAttribute('data-alis-collect', 'self');
    document.body.appendChild(input);

    let capturedValue = '';
    const onTrigger = vi.fn((element: HTMLInputElement) => {
      capturedValue = element.value;
    });
    setupDelegation(['input'], onTrigger);

    // Type 'a'
    input.value = 'a';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Type 'ab' before debounce fires
    vi.advanceTimersByTime(200);
    input.value = 'ab';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Type 'abc' before debounce fires
    vi.advanceTimersByTime(200);
    input.value = 'abc';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Still shouldn't have fired
    expect(onTrigger).not.toHaveBeenCalled();

    // Wait for debounce
    vi.advanceTimersByTime(500);

    // Should have fired once with the CURRENT value
    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(capturedValue).toBe('abc');
  });

  it('debounce resets on each input event', async () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.setAttribute('data-alis-get', '/api/search');
    input.setAttribute('data-alis-trigger', 'input delay:500ms');
    document.body.appendChild(input);

    const onTrigger = vi.fn();
    setupDelegation(['input'], onTrigger);

    // Type first character
    input.value = 'a';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait 400ms (not enough for debounce)
    vi.advanceTimersByTime(400);
    expect(onTrigger).not.toHaveBeenCalled();

    // Type another character (resets debounce)
    input.value = 'ab';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait another 400ms (still not 500ms from last input)
    vi.advanceTimersByTime(400);
    expect(onTrigger).not.toHaveBeenCalled();

    // Wait final 100ms+ to complete debounce
    vi.advanceTimersByTime(150);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});

