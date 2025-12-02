import { describe, expect, it, vi } from 'vitest';
import { applyJitter, calculateDelay } from '../../../src/retry/backoff.js';

describe('retry/backoff', () => {
  it('calculates exponential delay up to max', () => {
    const options = { baseDelay: 100, maxDelay: 1000 };
    expect(calculateDelay(1, options)).toBe(100);
    expect(calculateDelay(2, options)).toBe(200);
    expect(calculateDelay(5, options)).toBe(1000);
  });

  it('applies jitter range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = applyJitter(1000, 0.2);
    expect(result).toBe(1000);
    vi.restoreAllMocks();
  });
});

