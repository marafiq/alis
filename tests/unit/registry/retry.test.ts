import { afterEach, describe, expect, it } from 'vitest';
import { clearRetryPolicies, getRetryPolicy, listRetryPolicies, registerRetryPolicy } from '../../../src/registry/retry.js';

describe('registry/retry', () => {
  afterEach(() => {
    clearRetryPolicies();
  });

  it('includes default policy', () => {
    const policy = getRetryPolicy();
    expect(policy.maxAttempts).toBe(3);
    expect(listRetryPolicies()).toEqual(['default']);
  });

  it('registers custom policies', () => {
    const custom = { maxAttempts: 5 };
    registerRetryPolicy('fast', custom);
    expect(getRetryPolicy('fast')).toBe(custom);
  });

  it('throws on missing policies', () => {
    expect(() => getRetryPolicy('missing')).toThrow();
  });
});

