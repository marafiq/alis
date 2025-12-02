import { ValidationResult } from '../ValidationResult.js';

export const name = 'required';

/**
 * Required field validator.
 * @param {unknown} value
 * @param {{ message?: string }} params
 * @param {Element} _element
 * @returns {import('../ValidationResult.js').ValidationResult}
 */
export function validate(value, params, _element) {
  const message = params.message || 'This field is required.';
  
  // Null or undefined
  if (value === null || value === undefined) {
    return ValidationResult.invalid(message);
  }
  
  // Empty string or whitespace-only
  if (typeof value === 'string' && value.trim() === '') {
    return ValidationResult.invalid(message);
  }
  
  // Empty array
  if (Array.isArray(value) && value.length === 0) {
    return ValidationResult.invalid(message);
  }
  
  return ValidationResult.valid();
}

