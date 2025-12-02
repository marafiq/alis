import { describe, expect, it, vi } from 'vitest';
import { setupDelegation, teardownDelegation } from '../../../src/trigger/delegation.js';

describe('trigger/delegation', () => {
  it('invokes callback when ALIS element triggered', () => {
    const onTrigger = vi.fn();
    setupDelegation(['click'], onTrigger);
    const el = document.createElement('button');
    el.setAttribute('data-alis', '');
    document.body.appendChild(el);

    el.click();

    expect(onTrigger).toHaveBeenCalledWith(el, expect.any(Event), el);
    document.body.removeChild(el);
    teardownDelegation();
  });
});

