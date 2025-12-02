import { describe, expect, it } from 'vitest';
import { validate } from '../../../../src/validation/validators/length.js';

describe('length validator', () => {
  const input = document.createElement('input');

  it('returns invalid for string below min', () => {
    const result = validate('ab', { min: '3', max: '10', message: 'Between 3 and 10' }, input);
    expect(result.isValid).toBe(false);
  });

  it('returns invalid for string above max', () => {
    const result = validate('12345678901', { min: '3', max: '10', message: 'Between 3 and 10' }, input);
    expect(result.isValid).toBe(false);
  });

  it('returns valid for string within range', () => {
    const result = validate('hello', { min: '3', max: '10', message: 'Between 3 and 10' }, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for string at min boundary', () => {
    const result = validate('abc', { min: '3', max: '10', message: 'Between 3 and 10' }, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for string at max boundary', () => {
    const result = validate('1234567890', { min: '3', max: '10', message: 'Between 3 and 10' }, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for empty string', () => {
    const result = validate('', { min: '3', max: '10', message: 'Between 3 and 10' }, input);
    expect(result.isValid).toBe(true);
  });
});

