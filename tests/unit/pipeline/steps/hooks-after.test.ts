import { describe, expect, it, vi } from 'vitest';
import { hooksAfterStep } from '../../../../src/pipeline/steps/hooks-after.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/hooks-after', () => {
  it('runs after handlers without aborting', async () => {
    const handler = vi.fn();
    const ctx = createContext(document.createElement('div'), {
      config: { onAfter: handler }
    });
    const result = await hooksAfterStep(ctx);
    expect(handler).toHaveBeenCalled();
    expect(result.state.aborted).toBe(false);
  });
});

