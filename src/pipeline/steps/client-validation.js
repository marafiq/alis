import { ValidationEngine } from '../../validation/ValidationEngine.js';
import { FieldTriggers } from '../../validation/triggers/FieldTriggers.js';
import { ALISError } from '../../errors/types.js';

// Singleton engine instance for the default pipeline
const engine = new ValidationEngine();

/** @type {WeakMap<HTMLFormElement, FieldTriggers>} */
const formTriggers = new WeakMap();

/**
 * Lazily set up field triggers for a form.
 * This enables "angry on blur, forgiving on input" validation.
 * @param {HTMLFormElement} form
 */
function ensureFieldTriggers(form) {
  if (formTriggers.has(form)) {
    return formTriggers.get(form);
  }
  
  const triggers = new FieldTriggers((field) => {
    // Validate the field and show/clear errors
    const result = engine.validateField(field, { showErrors: true });
    
    // Track invalid state for "forgiving on input"
    if (result.isValid) {
      triggers.markAsValid(field);
    } else {
      triggers.markAsInvalid(field);
    }
  }, { debounceMs: 150 });
  
  triggers.attach(form);
  formTriggers.set(form, triggers);
  
  return triggers;
}

/**
 * Client-side validation pipeline step.
 * 
 * When data-alis-validate="true" is present on a form,
 * this step will validate all fields before the request is sent.
 * If validation fails, ctx.error is set and the pipeline will stop.
 * 
 * @param {import('../context.js').PipelineContext} ctx
 * @returns {import('../context.js').PipelineContext}
 */
export function clientValidationStep(ctx) {
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
  
  // Lazily set up field triggers for blur/input validation
  const triggers = ensureFieldTriggers(element);
  
  // Run validation and track invalid fields
  const fields = element.querySelectorAll('[data-val="true"]');
  const invalidFieldsList = [];
  
  for (const field of fields) {
    const result = engine.validateField(field, { showErrors: true });
    if (!result.isValid) {
      triggers.markAsInvalid(field);
      invalidFieldsList.push(field);
    } else {
      triggers.markAsValid(field);
    }
  }
  
  if (invalidFieldsList.length > 0) {
    // Collect error messages
    const messages = invalidFieldsList
      .map(f => f.getAttribute('name') || 'field')
      .join(', ');
    
    // Set error to prevent the request from being sent
    // Do NOT set ctx.state.aborted so cleanup steps still run
    ctx.error = new ALISError(
      'Validation failed for: ' + messages,
      'VALIDATION_ERROR'
    );
  }
  
  return ctx;
}

/**
 * Get the validation engine instance for external use.
 * @returns {ValidationEngine}
 */
export function getValidationEngine() {
  return engine;
}

