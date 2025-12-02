import { ValidationResult } from '../ValidationResult.js';

export const name = 'range';

/**
 * Numeric range validator.
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
  
  const min = typeof params.min === 'number' ? params.min : parseFloat(String(params.min));
  const max = typeof params.max === 'number' ? params.max : parseFloat(String(params.max));
  const message = params.message || `Value must be between ${min} and ${max}.`;
  
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (isNaN(numValue) || numValue < min || numValue > max) {
    return ValidationResult.invalid(message);
  }
  
  return ValidationResult.valid();
}

