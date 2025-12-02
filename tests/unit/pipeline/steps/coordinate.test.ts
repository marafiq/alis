import { describe, expect, it } from 'vitest';
import { completeCoordinate, coordinateStep } from '../../../../src/pipeline/steps/coordinate.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/coordinate', () => {
  it('allows first request to proceed', () => {
    const element = document.createElement('button');
    const ctx = createContext(element);
    const result = coordinateStep(ctx);
    expect(result.state.aborted).toBe(false);
    completeCoordinate(ctx);
  });

  it('aborts duplicate when strategy is ignore', () => {
    const element = document.createElement('button');
    const first = coordinateStep(createContext(element));
    expect(first.state.aborted).toBe(false);

    const second = coordinateStep(createContext(element));
    expect(second.state.aborted).toBe(true);

    completeCoordinate(first);
  });
});

