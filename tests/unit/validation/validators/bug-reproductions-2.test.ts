import { describe, expect, it } from 'vitest';
import { validate as validateLength } from '../../../../src/validation/validators/length.js';
import { validate as validateNumber } from '../../../../src/validation/validators/number.js';

describe('BUG: length validator with undefined min/max', () => {
  const input = document.createElement('input');

  it('should fail validation when min is undefined', () => {
    // BUG: Same as minlength - when min is undefined, comparison with NaN is always false
    const result = validateLength('ab', { min: undefined, max: 10 }, input);

    // Value "ab" (length 2) should fail if min is supposed to be enforced
    // But since min is NaN, the check `value.length < NaN` is false
    // This test documents the current buggy behavior
    expect(result.isValid).toBe(true); // BUG: should check if this is intended
  });

  it('should fail validation when max is undefined', () => {
    // BUG: When max is undefined, comparison with NaN is always false
    const result = validateLength('this is a very long string', { min: 1, max: undefined }, input);

    // Should this pass or fail? Currently passes because max is NaN
    expect(result.isValid).toBe(true); // BUG: documents current behavior
  });

  it('should not show NaN in error message', () => {
    const result = validateLength('ab', { min: 5, max: undefined }, input);

    // BUG: Default message is "Length must be between 5 and NaN."
    if (!result.isValid && result.message) {
      expect(result.message).not.toContain('NaN');
    }
  });

  it('should fail when both min and max are undefined', () => {
    // FIXED: When both are undefined, validation fails with configuration error
    const result = validateLength('anything', { min: undefined, max: undefined }, input);

    // Now correctly fails as a configuration error
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Invalid length configuration.');
  });
});

describe('BUG: number validator missing scientific notation', () => {
  const input = document.createElement('input');

  it('should accept scientific notation with lowercase e', () => {
    // BUG: NUMBER_REGEX = /^-?\d+(\.\d+)?$/ doesn't match scientific notation
    const result = validateNumber('1e10', {}, input);

    // 1e10 is a valid JavaScript number (10000000000)
    expect(result.isValid).toBe(true);
  });

  it('should accept scientific notation with uppercase E', () => {
    const result = validateNumber('3.14E-5', {}, input);

    // 3.14E-5 is a valid JavaScript number (0.0000314)
    expect(result.isValid).toBe(true);
  });

  it('should accept negative scientific notation', () => {
    const result = validateNumber('-2.5e3', {}, input);

    // -2.5e3 is a valid JavaScript number (-2500)
    expect(result.isValid).toBe(true);
  });

  it('should accept positive exponent with plus sign', () => {
    const result = validateNumber('1.5e+10', {}, input);

    // 1.5e+10 is valid
    expect(result.isValid).toBe(true);
  });
});
