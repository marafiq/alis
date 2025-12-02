import { describe, expect, it } from 'vitest';
import { validate } from '../../../../src/validation/validators/email.js';

describe('email validator', () => {
  const input = document.createElement('input');
  const params = { message: 'Invalid email address' };

  it('returns invalid for missing @', () => {
    const result = validate('testexample.com', params, input);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Invalid email address');
  });

  it('returns invalid for missing domain', () => {
    const result = validate('test@', params, input);
    expect(result.isValid).toBe(false);
  });

  it('returns valid for standard email', () => {
    const result = validate('test@example.com', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for email with subdomain', () => {
    const result = validate('user@mail.example.com', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for empty value', () => {
    const result = validate('', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for email with plus sign', () => {
    const result = validate('user+tag@example.com', params, input);
    expect(result.isValid).toBe(true);
  });
});

