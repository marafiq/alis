import { describe, expect, it } from 'vitest';
import { AbortError, ALISError, ConfigError, NetworkError, ValidationError } from '../../../src/errors/types.js';

describe('errors/types', () => {
  it('creates a base ALISError with code and context', () => {
    const err = new ALISError('boom', 'CUSTOM', { foo: 'bar' });
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe('CUSTOM');
    expect(err.context).toEqual({ foo: 'bar' });
  });

  it('specialized errors use predefined codes', () => {
    expect(new ValidationError().code).toBe('VALIDATION_ERROR');
    expect(new ConfigError().code).toBe('CONFIG_ERROR');
    expect(new NetworkError().code).toBe('NETWORK_ERROR');
    expect(new AbortError().code).toBe('ABORT_ERROR');
  });
});

