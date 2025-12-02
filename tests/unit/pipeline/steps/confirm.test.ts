import { describe, expect, it } from 'vitest';
import { confirmStep } from '../../../../src/pipeline/steps/confirm.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/confirm', () => {
  it('skips when no confirm configured', async () => {
    const ctx = createContext(document.createElement('button'));
    const result = await confirmStep(ctx);
    expect(result.state.aborted).toBe(false);
  });

  it('aborts when confirm returns false', async () => {
    const ctx = createContext(document.createElement('button'), {
      config: {
        confirm: () => Promise.resolve(false)
      }
    });

    const result = await confirmStep(ctx);
    expect(result.state.aborted).toBe(true);
  });
});

