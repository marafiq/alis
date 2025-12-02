import { ValidationResult } from '../ValidationResult.js';

export const name = 'length';

/**
 * Length range validator (combined min/max).
 * @param {unknown} value
 * @param {{ min?: string | number; max?: string | number; message?: string }} params
 * @param {Element} _element
 * @returns {import('../ValidationResult.js').ValidationResult}
 */
export function validate(value, params, _element) {
  // Empty values pass
  if (value === null || value === undefined || value === '') {
    return ValidationResult.valid();
  }
  
  const min = typeof params.min === 'number' ? params.min : parseInt(String(params.min), 10);
  const max = typeof params.max === 'number' ? params.max : parseInt(String(params.max), 10);
  const message = params.message || `Length must be between ${min} and ${max}.`;
  
  if (typeof value === 'string') {
    if (value.length < min || value.length > max) {
      return ValidationResult.invalid(message);
    }
  }
  
  return ValidationResult.valid();
}

