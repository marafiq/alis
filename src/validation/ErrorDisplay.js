import { findFieldByName, findValidationSpan } from './field-matcher.js';

/**
 * Syncfusion wrapper class names.
 */
const SYNCFUSION_WRAPPER_CLASSES = [
  'e-input-group',
  'e-control-wrapper',
  'e-checkbox-wrapper'
];

/**
 * Handles displaying and clearing validation errors in the DOM.
 */
export class ErrorDisplay {
  /**
   * Show an error for a field.
   * @param {HTMLFormElement} form
   * @param {string} fieldName
   * @param {string} message
   */
  showError(form, fieldName, message) {
    // Find and update validation span
    const span = findValidationSpan(form, fieldName);
    if (span) {
      span.textContent = message;
      span.classList.remove('field-validation-valid');
      span.classList.add('field-validation-error');
    }
    
    // Find and update input field
    const input = findFieldByName(form, fieldName);
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.classList.remove('input-validation-valid');
      input.classList.add('input-validation-error');
      
      // Handle Syncfusion wrapper
      this.#addSyncfusionErrorClass(input);
    }
  }
  
  /**
   * Clear error for a field.
   * @param {HTMLFormElement} form
   * @param {string} fieldName
   */
  clearError(form, fieldName) {
    // Clear validation span
    const span = findValidationSpan(form, fieldName);
    if (span) {
      span.textContent = '';
      span.classList.remove('field-validation-error');
      span.classList.add('field-validation-valid');
    }
    
    // Clear input field
    const input = findFieldByName(form, fieldName);
    if (input) {
      input.removeAttribute('aria-invalid');
      input.classList.remove('input-validation-error');
      input.classList.add('input-validation-valid');
      
      // Handle Syncfusion wrapper
      this.#removeSyncfusionErrorClass(input);
    }
  }
  
  /**
   * Clear all errors in a form.
   * @param {HTMLFormElement} form
   */
  clearAllErrors(form) {
    // Clear all validation spans
    form.querySelectorAll('[data-valmsg-for]').forEach(span => {
      span.textContent = '';
      span.classList.remove('field-validation-error');
      span.classList.add('field-validation-valid');
    });
    
    // Clear all inputs
    form.querySelectorAll('[aria-invalid="true"]').forEach(input => {
      input.removeAttribute('aria-invalid');
    });
    
    form.querySelectorAll('.input-validation-error').forEach(input => {
      input.classList.remove('input-validation-error');
      input.classList.add('input-validation-valid');
    });
    
    // Clear Syncfusion wrappers
    form.querySelectorAll('.e-error').forEach(wrapper => {
      wrapper.classList.remove('e-error');
    });
  }
  
  /**
   * Add error class to Syncfusion wrapper if present.
   * @param {Element} input
   */
  #addSyncfusionErrorClass(input) {
    const wrapper = this.#findSyncfusionWrapper(input);
    if (wrapper) {
      wrapper.classList.add('e-error');
    }
  }
  
  /**
   * Remove error class from Syncfusion wrapper if present.
   * @param {Element} input
   */
  #removeSyncfusionErrorClass(input) {
    const wrapper = this.#findSyncfusionWrapper(input);
    if (wrapper) {
      wrapper.classList.remove('e-error');
    }
  }
  
  /**
   * Find Syncfusion wrapper for an input.
   * @param {Element} input
   * @returns {Element | null}
   */
  #findSyncfusionWrapper(input) {
    let parent = input.parentElement;
    
    while (parent) {
      const hasWrapperClass = SYNCFUSION_WRAPPER_CLASSES.some(cls => 
        parent?.classList.contains(cls)
      );
      
      if (hasWrapperClass) {
        return parent;
      }
      
      parent = parent.parentElement;
    }
    
    return null;
  }
}

