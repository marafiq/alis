import { ValidationResult } from '../ValidationResult.js';

export const name = 'email';

// Simple email regex - matches most common cases
// Based on HTML5 email input pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email format validator.
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
  
  const message = params.message || 'Invalid email address.';
  
  if (!EMAIL_REGEX.test(String(value))) {
    return ValidationResult.invalid(message);
  }
  
  return ValidationResult.valid();
}

