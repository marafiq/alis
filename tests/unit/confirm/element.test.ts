import { afterEach, describe, expect, it, vi } from 'vitest';
import { executeElementConfirm } from '../../../src/confirm/element.js';
import { registerConfirm, clearConfirms } from '../../../src/confirm/registry.js';
import { createContext } from '../../../src/pipeline/context.js';

describe('confirm/element', () => {
  afterEach(() => {
    clearConfirms();
    vi.restoreAllMocks();
  });

  it('executes named confirm handler', async () => {
    registerConfirm('custom', () => true);
    const button = document.createElement('button');
    button.setAttribute('data-alis-confirm', 'custom');
    const ctx = createContext(button);
    await expect(executeElementConfirm(button, ctx)).resolves.toBe(true);
  });

  it('falls back to window.confirm', async () => {
    const originalConfirm = window.confirm;
    const spy = vi.fn().mockReturnValue(true);
    Object.defineProperty(window, 'confirm', { value: spy, configurable: true });
    const button = document.createElement('button');
    button.setAttribute('data-alis-confirm-message', 'Proceed?');
    const ctx = createContext(button);
    await executeElementConfirm(button, ctx);
    expect(spy).toHaveBeenCalledWith('Proceed?');
    Object.defineProperty(window, 'confirm', { value: originalConfirm, configurable: true });
  });
});

