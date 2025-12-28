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
  const hasMin = !isNaN(min);
  const hasMax = !isNaN(max);

  // Build appropriate message based on which bounds are set
  let defaultMessage;
  if (hasMin && hasMax) {
    defaultMessage = `Value must be between ${min} and ${max}.`;
  } else if (hasMin) {
    defaultMessage = `Value must be at least ${min}.`;
  } else if (hasMax) {
    defaultMessage = `Value must be at most ${max}.`;
  } else {
    // Neither min nor max is valid - configuration error
    return ValidationResult.invalid(params.message || 'Invalid range configuration.');
  }

  const message = params.message || defaultMessage;
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));

  if (isNaN(numValue)) {
    return ValidationResult.invalid(message);
  }

  if (hasMin && numValue < min) {
    return ValidationResult.invalid(message);
  }

  if (hasMax && numValue > max) {
    return ValidationResult.invalid(message);
  }

  return ValidationResult.valid();
}

