import { ValidationResult } from '../ValidationResult.js';

export const name = 'equalto';

/**
 * Field comparison validator.
 * @param {unknown} value
 * @param {{ other?: string; message?: string }} params
 * @param {Element} element
 * @returns {import('../ValidationResult.js').ValidationResult}
 */
export function validate(value, params, element) {
  // Empty values pass
  if (value === null || value === undefined || value === '') {
    return ValidationResult.valid();
  }
  
  const message = params.message || 'Values must match.';
  let otherFieldName = params.other;
  
  if (!otherFieldName) {
    return ValidationResult.valid();
  }
  
  // Handle ASP.NET Core *.FieldName format
  if (otherFieldName.startsWith('*.')) {
    otherFieldName = otherFieldName.substring(2);
  }
  
  // Find the other field in the same form
  const form = element.closest('form');
  if (!form) {
    return ValidationResult.valid();
  }
  
  const otherField = form.querySelector(`[name="${otherFieldName}"]`);
  if (!otherField) {
    return ValidationResult.valid();
  }
  
  const otherValue = otherField instanceof HTMLInputElement 
    ? otherField.value 
    : otherField instanceof HTMLSelectElement 
    ? otherField.value 
    : otherField instanceof HTMLTextAreaElement 
    ? otherField.value 
    : null;
  
  if (String(value) !== String(otherValue)) {
    return ValidationResult.invalid(message);
  }
  
  return ValidationResult.valid();
}

