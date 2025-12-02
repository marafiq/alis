import { describe, expect, it } from 'vitest';
import { validate } from '../../../../src/validation/validators/minlength.js';

describe('minlength validator', () => {
  const input = document.createElement('input');
  const params = { min: '5', message: 'Minimum 5 characters' };

  it('returns invalid for string below min length', () => {
    const result = validate('abc', params, input);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Minimum 5 characters');
  });

  it('returns valid for string at min length', () => {
    const result = validate('abcde', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for string above min length', () => {
    const result = validate('abcdefgh', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for null (not required)', () => {
    const result = validate(null, params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for empty string (not required)', () => {
    const result = validate('', params, input);
    expect(result.isValid).toBe(true);
  });

  it('handles numeric min parameter', () => {
    const result = validate('ab', { min: 3, message: 'Too short' }, input);
    expect(result.isValid).toBe(false);
  });
});

