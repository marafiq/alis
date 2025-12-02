import { describe, expect, it } from 'vitest';
import { validate } from '../../../../src/validation/validators/regex.js';

describe('regex validator', () => {
  const input = document.createElement('input');
  const params = { pattern: '^[A-Z]+$', message: 'Only uppercase letters' };

  it('returns invalid for non-matching value', () => {
    const result = validate('abc', params, input);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Only uppercase letters');
  });

  it('returns valid for matching value', () => {
    const result = validate('ABC', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for empty value', () => {
    const result = validate('', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for null', () => {
    const result = validate(null, params, input);
    expect(result.isValid).toBe(true);
  });

  it('handles complex patterns', () => {
    const result = validate('test@example.com', { pattern: '^[^@]+@[^@]+$', message: 'Invalid' }, input);
    expect(result.isValid).toBe(true);
  });

  it('returns invalid for partial match', () => {
    const result = validate('ABCdef', params, input);
    expect(result.isValid).toBe(false);
  });
});

