/**
 * @typedef {Object} FieldTriggersOptions
 * @property {number} [debounceMs] - Debounce delay for input events (default: 0)
 */

/**
 * Manages validation triggers for form fields.
 * Implements "angry on blur, forgiving on input" pattern.
 */
export class FieldTriggers {
  /** @type {(field: Element) => void} */
  #onValidate;
  
  /** @type {WeakSet<Element>} */
  #touched = new WeakSet();
  
  /** @type {WeakSet<Element>} */
  #invalid = new WeakSet();
  
  /** @type {Map<HTMLFormElement, { blur: (e: Event) => void; input: (e: Event) => void }>} */
  #listeners = new Map();
  
  /** @type {Map<Element, ReturnType<typeof setTimeout>>} */
  #debounceTimers = new Map();
  
  /** @type {number} */
  #debounceMs;

  /**
   * @param {(field: Element) => void} onValidate - Callback when field should be validated
   * @param {FieldTriggersOptions} [options]
   */
  constructor(onValidate, options = {}) {
    this.#onValidate = onValidate;
    this.#debounceMs = options.debounceMs ?? 0;
  }

  /**
   * Attach event listeners to a form.
   * @param {HTMLFormElement} form
   */
  attach(form) {
    if (this.#listeners.has(form)) {
      return;
    }
    
    const blurHandler = (e) => this.#handleBlur(e);
    const inputHandler = (e) => this.#handleInput(e);
    
    form.addEventListener('blur', blurHandler, true);
    form.addEventListener('input', inputHandler, true);
    
    this.#listeners.set(form, { blur: blurHandler, input: inputHandler });
  }

  /**
   * Detach event listeners from a form.
   * @param {HTMLFormElement} form
   */
  detach(form) {
    const handlers = this.#listeners.get(form);
    if (!handlers) {
      return;
    }
    
    form.removeEventListener('blur', handlers.blur, true);
    form.removeEventListener('input', handlers.input, true);
    
    this.#listeners.delete(form);
  }

  /**
   * Check if a field has been touched (blurred at least once).
   * @param {Element} field
   * @returns {boolean}
   */
  isTouched(field) {
    return this.#touched.has(field);
  }

  /**
   * Check if a field is currently marked as invalid.
   * @param {Element} field
   * @returns {boolean}
   */
  isInvalid(field) {
    return this.#invalid.has(field);
  }

  /**
   * Mark a field as invalid.
   * @param {Element} field
   */
  markAsInvalid(field) {
    this.#invalid.add(field);
  }

  /**
   * Mark a field as valid.
   * @param {Element} field
   */
  markAsValid(field) {
    this.#invalid.delete(field);
  }

  /**
   * Reset all state.
   */
  reset() {
    this.#touched = new WeakSet();
    this.#invalid = new WeakSet();
    
    // Clear all debounce timers
    for (const timer of this.#debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.#debounceTimers.clear();
  }

  /**
   * Handle blur event - validate on first touch.
   * @param {Event} e
   */
  #handleBlur(e) {
    const field = e.target;
    if (!(field instanceof Element)) {
      return;
    }
    
    if (!this.#shouldValidate(field)) {
      return;
    }
    
    this.#touched.add(field);
    this.#onValidate(field);
  }

  /**
   * Handle input event - re-validate if field has error.
   * @param {Event} e
   */
  #handleInput(e) {
    const field = e.target;
    if (!(field instanceof Element)) {
      return;
    }
    
    if (!this.#shouldValidate(field)) {
      return;
    }
    
    // Only re-validate if field has error (forgiving on input)
    if (!this.#invalid.has(field)) {
      return;
    }
    
    // Debounce if configured
    if (this.#debounceMs > 0) {
      const existing = this.#debounceTimers.get(field);
      if (existing) {
        clearTimeout(existing);
      }
      
      const timer = setTimeout(() => {
        this.#debounceTimers.delete(field);
        this.#onValidate(field);
      }, this.#debounceMs);
      
      this.#debounceTimers.set(field, timer);
    } else {
      this.#onValidate(field);
    }
  }

  /**
   * Check if a field should be validated.
   * @param {Element} field
   * @returns {boolean}
   */
  #shouldValidate(field) {
    return field.getAttribute('data-val') === 'true';
  }
}

