import { describe, expect, it } from 'vitest';
import { stateApplyStep } from '../../../../src/pipeline/steps/state-apply.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/state-apply', () => {
  it('applies state via manager', () => {
    const button = document.createElement('button');
    const ctx = createContext(button);
    button.textContent = 'Save';
    // stateCaptureStep would normally set this; emulate
    ctx.stateManager = {
      apply: () => {
        button.disabled = true;
      },
      restore: () => {}
    };
    const result = stateApplyStep(ctx);
    expect(button.disabled).toBe(true);
    expect(result.stateManager).toBeTruthy();
  });
});

