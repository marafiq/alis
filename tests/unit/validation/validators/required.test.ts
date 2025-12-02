import { describe, expect, it } from 'vitest';
import { validate } from '../../../../src/validation/validators/required.js';

describe('required validator', () => {
  const input = document.createElement('input');
  const params = { message: 'This field is required' };

  it('returns invalid for empty string', () => {
    const result = validate('', params, input);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('This field is required');
  });

  it('returns invalid for null', () => {
    const result = validate(null, params, input);
    expect(result.isValid).toBe(false);
  });

  it('returns invalid for undefined', () => {
    const result = validate(undefined, params, input);
    expect(result.isValid).toBe(false);
  });

  it('returns invalid for whitespace-only string', () => {
    const result = validate('   ', params, input);
    expect(result.isValid).toBe(false);
  });

  it('returns valid for non-empty string', () => {
    const result = validate('hello', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns invalid for empty array', () => {
    const result = validate([], params, input);
    expect(result.isValid).toBe(false);
  });
});

