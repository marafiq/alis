import { describe, expect, it } from 'vitest';
import { stateCaptureStep } from '../../../../src/pipeline/steps/state-capture.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/state-capture', () => {
  it('creates state manager when element present', () => {
    const button = document.createElement('button');
    const ctx = createContext(button);
    const result = stateCaptureStep(ctx);
    expect(result.stateManager).toBeTruthy();
  });
});

