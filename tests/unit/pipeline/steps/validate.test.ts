import { describe, expect, it } from 'vitest';
import { validateStep } from '../../../../src/pipeline/steps/validate.js';
import { createContext } from '../../../../src/pipeline/context.js';
import { ConfigError } from '../../../../src/errors/types.js';

describe('pipeline/steps/validate', () => {
  it('passes when element and config exist', () => {
    const ctx = createContext(document.createElement('form'));
    expect(() => validateStep(ctx)).not.toThrow();
  });

  it('throws when element missing', () => {
    const ctx = createContext(null);
    expect(() => validateStep(ctx)).toThrow(ConfigError);
  });
});

