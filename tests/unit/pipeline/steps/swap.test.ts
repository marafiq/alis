import { describe, expect, it } from 'vitest';
import { swapStep } from '../../../../src/pipeline/steps/swap.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/swap', () => {
  it('applies swap strategy to target', () => {
    const button = document.createElement('button');
    const target = document.createElement('div');
    target.id = 'result';
    document.body.appendChild(target);

    const ctx = createContext(button, {
      config: { target: 'result', swap: 'innerHTML' }
    });
    ctx.body = '<p>Updated</p>';

    swapStep(ctx);
    expect(document.querySelector('#result')?.innerHTML).toBe('<p>Updated</p>');

    document.body.removeChild(target);
  });
});

