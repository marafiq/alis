import { findFieldByName, findValidationSpan } from './field-matcher.js';

/**
 * @param {HTMLFormElement} form
 */
export function clearErrors(form) {
  // Clear validation message spans
  form.querySelectorAll('[data-valmsg-for]').forEach(node => {
    node.textContent = '';
    node.classList.remove('field-validation-error');
    node.classList.add('field-validation-valid');
  });
  
  // Clear input error states
  form.querySelectorAll('[aria-invalid="true"]').forEach(field => {
    field.removeAttribute('aria-invalid');
  });
  
  // Clear input error classes
  form.querySelectorAll('.input-validation-error').forEach(field => {
    field.classList.remove('input-validation-error');
    field.classList.add('input-validation-valid');
  });
}

/**
 * @param {HTMLFormElement} form
 * @param {{ errors?: Record<string, string[]> }} details
 */
export function displayErrors(form, details) {
  if (!details?.errors) {
    return;
  }

  Object.entries(details.errors).forEach(([field, messages]) => {
    // Find validation span (with case-insensitive fallback)
    const target = findValidationSpan(form, field);
    if (target) {
      target.textContent = messages.join(', ');
      target.classList.remove('field-validation-valid');
      target.classList.add('field-validation-error');
    }
    
    // Find input field (with case-insensitive fallback)
    const input = findFieldByName(form, field);
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.classList.remove('input-validation-valid');
      input.classList.add('input-validation-error');
    }
  });
}

