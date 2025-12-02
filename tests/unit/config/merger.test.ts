import { describe, expect, it } from 'vitest';
import { mergeConfig } from '../../../src/config/merger.js';

describe('config/merger', () => {
  it('deep merges nested objects without mutating inputs', () => {
    const globalConfig = {
      timeout: 1000,
      retry: { maxAttempts: 1, statusCodes: [500] }
    };
    const elementConfig = {
      retry: { maxAttempts: 3 },
      telemetry: 'debug'
    };

    const result = mergeConfig(globalConfig, elementConfig);

    expect(result.retry).toEqual({ maxAttempts: 3, statusCodes: [500] });
    expect(result.retry).not.toBe(globalConfig.retry);
    expect(globalConfig.retry.maxAttempts).toBe(1);
  });

  it('overwrites primitives and arrays by value', () => {
    const result = mergeConfig(
      { tags: ['a'], telemetry: 'info' },
      { tags: ['b'], telemetry: 'debug' }
    );

    expect(result.tags).toEqual(['b']);
    expect(result.telemetry).toBe('debug');
  });

  it('throws when arguments are not objects', () => {
    const bad = null as unknown as Record<string, unknown>;
    expect(() => mergeConfig(bad, {})).toThrow(TypeError);
    expect(() => mergeConfig({}, bad)).toThrow(TypeError);
  });
});

