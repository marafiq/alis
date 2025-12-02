import { describe, expect, it, vi } from 'vitest';
import { hooksBeforeStep } from '../../../../src/pipeline/steps/hooks-before.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/hooks-before', () => {
  it('runs handlers sequentially', async () => {
    const handler = vi.fn();
    const ctx = createContext(document.createElement('div'), {
      config: { onBefore: handler }
    });
    await hooksBeforeStep(ctx);
    expect(handler).toHaveBeenCalled();
  });

  it('aborts when handler returns false', async () => {
    const handler = vi.fn(() => false);
    const ctx = createContext(document.createElement('div'), {
      config: { onBefore: handler }
    });
    const result = await hooksBeforeStep(ctx);
    expect(result.state.aborted).toBe(true);
  });
});

