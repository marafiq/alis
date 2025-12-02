import { ValidationEngine } from '../ValidationEngine.js';
import { ALISError } from '../../errors/types.js';

/**
 * Creates a validation pipeline step for ALIS.
 * 
 * When data-alis-validate="true" is present on a form,
 * this step will validate all fields before the request is sent.
 * 
 * @returns {(ctx: import('../../pipeline/context.js').PipelineContext) => import('../../pipeline/context.js').PipelineContext}
 */
export function createValidationStep() {
  const engine = new ValidationEngine();
  
  return function clientValidateStep(ctx) {
    const element = ctx.element;
    
    // Only validate form elements
    if (!(element instanceof HTMLFormElement)) {
      return ctx;
    }
    
    // Check if validation is enabled
    const validateAttr = element.getAttribute('data-alis-validate');
    if (validateAttr !== 'true') {
      return ctx;
    }
    
    // Run validation
    const result = engine.validateForm(element, { showErrors: true });
    
    if (!result.isValid) {
      ctx.error = new ALISError(
        'Validation failed: ' + result.messages.join(', '),
        'VALIDATION_ERROR'
      );
    }
    
    return ctx;
  };
}

/**
 * Creates the validation module public API.
 * @returns {Object}
 */
export function createValidationAPI() {
  const engine = new ValidationEngine();
  
  return {
    /**
     * Validate a single field.
     * @param {Element} field
     * @param {{ showErrors?: boolean }} [options]
     */
    validateField(field, options = {}) {
      return engine.validateField(field, options);
    },
    
    /**
     * Validate all fields in a form.
     * @param {HTMLFormElement} form
     * @param {{ showErrors?: boolean }} [options]
     */
    validateForm(form, options = {}) {
      return engine.validateForm(form, options);
    },
    
    /**
     * Register a custom validator.
     * @param {string} name
     * @param {import('../ValidatorRegistry.js').ValidatorFn} validator
     */
    registerValidator(name, validator) {
      engine.registerValidator(name, validator);
    },
    
    /**
     * Clear all validation errors in a form.
     * @param {HTMLFormElement} form
     */
    clearErrors(form) {
      engine.clearErrors(form);
    }
  };
}

