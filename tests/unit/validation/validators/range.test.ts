import { describe, expect, it } from 'vitest';
import { validate } from '../../../../src/validation/validators/range.js';

describe('range validator', () => {
  const input = document.createElement('input');
  const params = { min: '1', max: '100', message: 'Must be between 1 and 100' };

  it('returns invalid for value below min', () => {
    const result = validate('0', params, input);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Must be between 1 and 100');
  });

  it('returns invalid for value above max', () => {
    const result = validate('101', params, input);
    expect(result.isValid).toBe(false);
  });

  it('returns valid for value within range', () => {
    const result = validate('50', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for value at min boundary', () => {
    const result = validate('1', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for value at max boundary', () => {
    const result = validate('100', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for empty value', () => {
    const result = validate('', params, input);
    expect(result.isValid).toBe(true);
  });
});

