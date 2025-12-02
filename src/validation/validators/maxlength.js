import { ValidationResult } from '../ValidationResult.js';

export const name = 'maxlength';

/**
 * Maximum length validator.
 * @param {unknown} value
 * @param {{ max?: string | number; message?: string }} params
 * @param {Element} _element
 * @returns {import('../ValidationResult.js').ValidationResult}
 */
export function validate(value, params, _element) {
  // Empty values pass
  if (value === null || value === undefined || value === '') {
    return ValidationResult.valid();
  }
  
  const max = typeof params.max === 'number' ? params.max : parseInt(String(params.max), 10);
  const message = params.message || `Maximum ${max} characters allowed.`;
  
  if (typeof value === 'string' && value.length > max) {
    return ValidationResult.invalid(message);
  }
  
  return ValidationResult.valid();
}

