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
  const hasMin = !isNaN(min);
  const hasMax = !isNaN(max);

  // Build appropriate message based on which bounds are set
  let defaultMessage;
  if (hasMin && hasMax) {
    defaultMessage = `Length must be between ${min} and ${max}.`;
  } else if (hasMin) {
    defaultMessage = `Length must be at least ${min}.`;
  } else if (hasMax) {
    defaultMessage = `Length must be at most ${max}.`;
  } else {
    // Neither min nor max is valid - configuration error
    return ValidationResult.invalid(params.message || 'Invalid length configuration.');
  }

  const message = params.message || defaultMessage;

  if (typeof value === 'string') {
    if (hasMin && value.length < min) {
      return ValidationResult.invalid(message);
    }
    if (hasMax && value.length > max) {
      return ValidationResult.invalid(message);
    }
  }

  return ValidationResult.valid();
}

