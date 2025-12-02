import { ValidationResult } from '../ValidationResult.js';

export const name = 'url';

/**
 * URL format validator.
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
  
  const message = params.message || 'Invalid URL.';
  
  try {
    new URL(String(value));
    return ValidationResult.valid();
  } catch {
    return ValidationResult.invalid(message);
  }
}

