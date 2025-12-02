import { afterEach, describe, expect, it } from 'vitest';
import { clearConfirms, executeConfirm, registerConfirm } from '../../../src/confirm/registry.js';
import { createContext } from '../../../src/pipeline/context.js';

describe('confirm/registry', () => {
  afterEach(() => {
    clearConfirms();
  });

  it('registers and executes confirm handlers', async () => {
    registerConfirm('delete', () => true);
    const ctx = createContext(document.createElement('button'));
    await expect(executeConfirm('delete', ctx)).resolves.toBe(true);
  });

  it('throws when handler missing', async () => {
    const ctx = createContext(document.createElement('button'));
    await expect(executeConfirm('missing', ctx)).rejects.toThrow();
  });
});

