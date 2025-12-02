/**
 * @typedef {import('./ValidationResult.js').ValidationResult} ValidationResult
 */

/**
 * @typedef {(value: unknown, params: Record<string, unknown>, element: Element) => ValidationResult} ValidatorFn
 */

/**
 * @typedef {Object} RegisterOptions
 * @property {boolean} [override] - Allow overriding existing validator
 */

/**
 * Registry for validation functions.
 * Validators receive (value, params, element) and return ValidationResult.
 */
export class ValidatorRegistry {
  /** @type {Map<string, ValidatorFn>} */
  #validators = new Map();

  /**
   * Register a validator function.
   * @param {string} name - Validator name (e.g., 'required', 'email')
   * @param {ValidatorFn} validator - Validation function
   * @param {RegisterOptions} [options] - Registration options
   */
  register(name, validator, options = {}) {
    if (this.#validators.has(name) && !options.override) {
      throw new Error(`Validator "${name}" is already registered. Use { override: true } to replace.`);
    }
    this.#validators.set(name, validator);
  }

  /**
   * Get a validator by name.
   * @param {string} name - Validator name
   * @returns {ValidatorFn | undefined}
   */
  get(name) {
    return this.#validators.get(name);
  }

  /**
   * Check if a validator is registered.
   * @param {string} name - Validator name
   * @returns {boolean}
   */
  has(name) {
    return this.#validators.has(name);
  }

  /**
   * Get all registered validator names.
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.#validators.keys());
  }
}

