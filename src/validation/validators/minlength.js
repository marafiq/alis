import { ValidationResult } from '../ValidationResult.js';

export const name = 'minlength';

/**
 * Minimum length validator.
 * @param {unknown} value
 * @param {{ min?: string | number; message?: string }} params
 * @param {Element} _element
 * @returns {import('../ValidationResult.js').ValidationResult}
 */
export function validate(value, params, _element) {
  // Empty values pass (use required for mandatory)
  if (value === null || value === undefined || value === '') {
    return ValidationResult.valid();
  }

  const min = typeof params.min === 'number' ? params.min : parseInt(String(params.min), 10);

  // If min is not a valid number, fail validation (configuration error)
  if (isNaN(min)) {
    return ValidationResult.invalid(params.message || 'Invalid minimum length configuration.');
  }

  const message = params.message || `Minimum ${min} characters required.`;

  if (typeof value === 'string' && value.length < min) {
    return ValidationResult.invalid(message);
  }

  return ValidationResult.valid();
}

