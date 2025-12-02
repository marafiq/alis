import { describe, expect, it } from 'vitest';
import { validate } from '../../../../src/validation/validators/maxlength.js';

describe('maxlength validator', () => {
  const input = document.createElement('input');
  const params = { max: '5', message: 'Maximum 5 characters' };

  it('returns invalid for string above max length', () => {
    const result = validate('abcdefgh', params, input);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Maximum 5 characters');
  });

  it('returns valid for string at max length', () => {
    const result = validate('abcde', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for string below max length', () => {
    const result = validate('abc', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for null', () => {
    const result = validate(null, params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for empty string', () => {
    const result = validate('', params, input);
    expect(result.isValid).toBe(true);
  });

  it('handles numeric max parameter', () => {
    const result = validate('abcdef', { max: 3, message: 'Too long' }, input);
    expect(result.isValid).toBe(false);
  });
});

