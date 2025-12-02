import { describe, expect, it, vi } from 'vitest';
import { setupDelegation, teardownDelegation } from '../../../src/trigger/delegation.js';

describe('trigger/delegation', () => {
  it('dispatches custom event when ALIS element triggered', () => {
    setupDelegation(['click']);
    const el = document.createElement('button');
    el.setAttribute('data-alis', '');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('alis:trigger', handler);

    el.click();

    expect(handler).toHaveBeenCalled();
    document.body.removeChild(el);
    teardownDelegation();
  });
});

