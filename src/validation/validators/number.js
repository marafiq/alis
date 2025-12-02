import { ValidationResult } from '../ValidationResult.js';

export const name = 'number';

// Matches integers and decimals, including negative
const NUMBER_REGEX = /^-?\d+(\.\d+)?$/;

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

