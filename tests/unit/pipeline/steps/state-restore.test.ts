import { describe, expect, it } from 'vitest';
import { stateRestoreStep } from '../../../../src/pipeline/steps/state-restore.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/state-restore', () => {
  it('restores via manager', () => {
    const button = document.createElement('button');
    const ctx = createContext(button);
    ctx.stateManager = {
      apply: () => {},
      restore: () => {
        button.disabled = false;
      }
    };
    button.disabled = true;
    stateRestoreStep(ctx);
    expect(button.disabled).toBe(false);
  });
});

