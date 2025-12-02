import { ValidationResult } from '../ValidationResult.js';

export const name = 'regex';

/**
 * Regular expression pattern validator.
 * @param {unknown} value
 * @param {{ pattern?: string; message?: string }} params
 * @param {Element} _element
 * @returns {import('../ValidationResult.js').ValidationResult}
 */
export function validate(value, params, _element) {
  // Empty values pass
  if (value === null || value === undefined || value === '') {
    return ValidationResult.valid();
  }
  
  const pattern = params.pattern;
  const message = params.message || 'Invalid format.';
  
  if (!pattern) {
    return ValidationResult.valid();
  }
  
  try {
    const regex = new RegExp(pattern);
    if (!regex.test(String(value))) {
      return ValidationResult.invalid(message);
    }
  } catch {
    // Invalid regex pattern - fail validation
    return ValidationResult.invalid(message);
  }
  
  return ValidationResult.valid();
}

