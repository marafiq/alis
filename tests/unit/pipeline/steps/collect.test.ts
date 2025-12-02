import { describe, expect, it } from 'vitest';
import { collectStep } from '../../../../src/pipeline/steps/collect.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/collect', () => {
  it('attaches collected data to context', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'email';
    input.value = 'test@example.com';
    form.appendChild(input);
    const ctx = createContext(form);
    const result = collectStep(ctx);
    expect(result.collect?.data).toEqual({ email: 'test@example.com' });
  });
});

