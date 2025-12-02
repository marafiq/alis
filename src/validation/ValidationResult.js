/**
 * @typedef {Object} CombinedValidationResult
 * @property {boolean} isValid - Whether all results are valid
 * @property {string[]} messages - Array of error messages from invalid results
 */

/**
 * Immutable validation result object.
 * Use static factory methods to create instances.
 */
export class ValidationResult {
  /** @type {boolean} */
  #isValid;
  
  /** @type {string | null} */
  #message;

  /**
   * @param {boolean} isValid
   * @param {string | null} message
   */
  constructor(isValid, message) {
    this.#isValid = isValid;
    this.#message = message;
    Object.freeze(this);
  }

  /** @returns {boolean} */
  get isValid() {
    return this.#isValid;
  }

  /** @returns {string | null} */
  get message() {
    return this.#message;
  }

  /**
   * Creates a valid result.
   * @returns {ValidationResult}
   */
  static valid() {
    return new ValidationResult(true, null);
  }

  /**
   * Creates an invalid result with a message.
   * @param {string} message - The error message
   * @returns {ValidationResult}
   */
  static invalid(message) {
    return new ValidationResult(false, message);
  }

  /**
   * Combines multiple validation results into one.
   * @param {ValidationResult[]} results - Array of validation results
   * @returns {CombinedValidationResult}
   */
  static combine(results) {
    const messages = results
      .filter(r => !r.isValid && r.message !== null)
      .map(r => /** @type {string} */ (r.message));
    
    return {
      isValid: results.every(r => r.isValid),
      messages
    };
  }
}

