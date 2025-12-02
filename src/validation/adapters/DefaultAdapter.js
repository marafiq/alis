/**
 * Default adapter for native HTML form elements.
 * @type {import('./types.js').Adapter}
 */
export const DefaultAdapter = {
  name: 'default',
  
  /**
   * Always returns true - this is the fallback adapter.
   * @param {Element} _element
   * @returns {boolean}
   */
  matches(_element) {
    return true;
  },
  
  /**
   * Gets the value from a form element.
   * @param {Element} element
   * @returns {unknown}
   */
  getValue(element) {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        return element.checked;
      }
      if (element.type === 'radio') {
        // For radio, find the checked one in the group
        const form = element.form;
        if (form) {
          const checked = form.querySelector(`input[name="${element.name}"]:checked`);
          return checked ? (/** @type {HTMLInputElement} */ (checked)).value : null;
        }
        return element.checked ? element.value : null;
      }
      return element.value;
    }
    
    if (element instanceof HTMLSelectElement) {
      if (element.multiple) {
        const selected = [];
        for (let i = 0; i < element.options.length; i++) {
          if (element.options[i].selected) {
            selected.push(element.options[i].value);
          }
        }
        return selected;
      }
      return element.value;
    }
    
    if (element instanceof HTMLTextAreaElement) {
      return element.value;
    }
    
    return null;
  },
  
  /**
   * Returns the element itself as the visible element.
   * @param {Element} element
   * @returns {Element}
   */
  getVisibleElement(element) {
    return element;
  },
  
  /**
   * Returns the element itself as the blur target.
   * @param {Element} element
   * @returns {Element}
   */
  getBlurTarget(element) {
    return element;
  }
};

