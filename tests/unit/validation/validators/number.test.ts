import { describe, expect, it } from 'vitest';
import { validate } from '../../../../src/validation/validators/number.js';

describe('number validator', () => {
  const input = document.createElement('input');
  const params = { message: 'Must be a number' };

  it('returns invalid for non-numeric string', () => {
    const result = validate('abc', params, input);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Must be a number');
  });

  it('returns valid for integer', () => {
    const result = validate('42', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for decimal', () => {
    const result = validate('3.14', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for negative number', () => {
    const result = validate('-10', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for empty value', () => {
    const result = validate('', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns invalid for mixed content', () => {
    const result = validate('12abc', params, input);
    expect(result.isValid).toBe(false);
  });
});

