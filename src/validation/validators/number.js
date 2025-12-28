import { ValidationResult } from '../ValidationResult.js';

export const name = 'number';

// Matches integers, decimals, and scientific notation (e.g., 1e10, 3.14E-5, -2.5e+3)
const NUMBER_REGEX = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

/**
 * Numeric value validator.
 * @param {unknown} value
 * @param {{ message?: string }} params
 * @param {Element} _element
 * @returns {import('../ValidationResult.js').ValidationResult}
 */
export function validate(value, params, _element) {
  // Empty values pass
  if (value === null || value === undefined || value === '') {
    return ValidationResult.valid();
  }
  
  const message = params.message || 'Must be a valid number.';
  const strValue = String(value);
  
  if (!NUMBER_REGEX.test(strValue)) {
    return ValidationResult.invalid(message);
  }
  
  return ValidationResult.valid();
}

