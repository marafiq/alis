import { ValidationResult } from './ValidationResult.js';
import { ValidatorRegistry } from './ValidatorRegistry.js';
import { parseValidationAttributes } from './AttributeParser.js';
import { shouldValidate } from './utils/shouldValidate.js';
import { ErrorDisplay } from './ErrorDisplay.js';
import { AdapterRegistry } from './adapters/AdapterRegistry.js';
import { SyncfusionAdapter } from './adapters/SyncfusionAdapter.js';
import { validators as builtInValidators } from './validators/index.js';

/**
 * @typedef {Object} ValidateOptions
 * @property {boolean} [showErrors] - Whether to display errors in the DOM
 * @property {boolean} [stopOnFirst] - Stop on first error (default: true)
 */

/**
 * Core validation engine.
 * Orchestrates validators, adapters, and error display.
 */
export class ValidationEngine {
  /** @type {ValidatorRegistry} */
  #validators = new ValidatorRegistry();
  
  /** @type {AdapterRegistry} */
  #adapters = new AdapterRegistry();
  
  /** @type {ErrorDisplay} */
  #display = new ErrorDisplay();

  constructor() {
    // Register built-in validators
    for (const validator of builtInValidators) {
      this.#validators.register(validator.name, validator.validate);
    }
    
    // Register Syncfusion adapter
    this.#adapters.register(SyncfusionAdapter);
  }

  /**
   * Validate a single field.
   * @param {Element} field
   * @param {ValidateOptions} [options]
   * @returns {import('./ValidationResult.js').ValidationResult}
   */
  validateField(field, options = {}) {
    const { showErrors = false, stopOnFirst = true } = options;
    const fieldName = field.getAttribute('name') || '';
    const form = field.closest('form');
    
    // Parse validation attributes
    const parsed = parseValidationAttributes(field);
    
    if (!parsed.enabled) {
      return ValidationResult.valid();
    }
    
    // Get value using adapter
    const adapter = this.#adapters.getAdapter(field);
    const value = adapter.getValue(field);
    
    // Run validators
    for (const validatorConfig of parsed.validators) {
      const validator = this.#validators.get(validatorConfig.name);
      
      if (!validator) {
        continue;
      }
      
      const result = validator(value, { message: validatorConfig.message, ...validatorConfig.params }, field);
      
      if (!result.isValid) {
        if (showErrors && form) {
          this.#display.showError(form, fieldName, result.message || '');
        }
        
        if (stopOnFirst) {
          return result;
        }
      }
    }
    
    // Field is valid - clear any existing errors
    if (showErrors && form) {
      this.#display.clearError(form, fieldName);
    }
    
    return ValidationResult.valid();
  }

  /**
   * Validate all fields in a form.
   * @param {HTMLFormElement} form
   * @param {ValidateOptions} [options]
   * @returns {import('./ValidationResult.js').CombinedValidationResult}
   */
  validateForm(form, options = {}) {
    const { showErrors = false } = options;
    
    // Find all validatable fields
    const fields = form.querySelectorAll('[data-val="true"]');
    
    /** @type {import('./ValidationResult.js').ValidationResult[]} */
    const results = [];
    
    for (const field of fields) {
      // Skip fields that shouldn't be validated
      if (!shouldValidate(field)) {
        continue;
      }
      
      const result = this.validateField(field, { ...options, showErrors });
      results.push(result);
    }
    
    return ValidationResult.combine(results);
  }

  /**
   * Register a custom validator.
   * @param {string} name
   * @param {import('./ValidatorRegistry.js').ValidatorFn} validator
   */
  registerValidator(name, validator) {
    this.#validators.register(name, validator, { override: true });
  }

  /**
   * Clear all errors in a form.
   * @param {HTMLFormElement} form
   */
  clearErrors(form) {
    this.#display.clearAllErrors(form);
  }
}

