import { describe, expect, it } from 'vitest';
import { validateStep } from '../../../../src/pipeline/steps/validate.js';
import { createContext } from '../../../../src/pipeline/context.js';
import { ConfigError } from '../../../../src/errors/types.js';

describe('pipeline/steps/validate', () => {
  it('passes when config has url', () => {
    const ctx = createContext(document.createElement('form'), { config: { url: '/api/test' } });
    expect(() => validateStep(ctx)).not.toThrow();
  });

  it('throws when url missing', () => {
    const ctx = createContext(document.createElement('form'));
    expect(() => validateStep(ctx)).toThrow(ConfigError);
  });
});

