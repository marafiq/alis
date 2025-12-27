import { getSyncfusionValue, hasSyncfusionInstance } from '../syncfusion/constants.js';

/**
 * Native HTML element value reader.
 * Handles standard HTML form elements: input, select, textarea, button.
 */
export const NativeValueReader = {
  /**
   * Check if this reader can handle the element.
   * @param {Element} element
   * @returns {boolean}
   */
  matches(element) {
    return (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLButtonElement
    );
  },

  /**
   * Read value from a native HTML element.
   * @param {Element} element
   * @returns {{ value: unknown; skip?: boolean } | null}
   */
  getValue(element) {
    if (element instanceof HTMLInputElement) {
      return this.getInputValue(element);
    }
    if (element instanceof HTMLSelectElement) {
      return this.getSelectValue(element);
    }
    if (element instanceof HTMLTextAreaElement) {
      return { value: element.value };
    }
    if (element instanceof HTMLButtonElement) {
      return { value: element.value };
    }
    return null;
  },

  /**
   * Read value from an input element.
   * @param {HTMLInputElement} element
   * @returns {{ value: unknown; skip?: boolean }}
   */
  getInputValue(element) {
    switch (element.type) {
      case 'checkbox':
        // Unchecked checkboxes should be skipped in form data
        return element.checked
          ? { value: element.value || 'on' }
          : { value: null, skip: true };

      case 'radio':
        // Unselected radio buttons should be skipped
        return element.checked
          ? { value: element.value }
          : { value: null, skip: true };

      case 'file':
        return this.getFileValue(element);

      default:
        return { value: element.value };
    }
  },

  /**
   * Read files from a file input.
   * Returns single File for single file input, array for multiple.
   * @param {HTMLInputElement} element
   * @returns {{ value: File | File[] | null; skip?: boolean }}
   */
  getFileValue(element) {
    const files = element.files;
    if (!files || files.length === 0) {
      return { value: null, skip: true };
    }
    if (element.multiple) {
      return { value: Array.from(files) };
    }
    return { value: files[0] };
  },

  /**
   * Read value from a select element.
   * Returns array for multiple select, single value otherwise.
   * @param {HTMLSelectElement} element
   * @returns {{ value: string | string[] }}
   */
  getSelectValue(element) {
    if (element.multiple) {
      /** @type {string[]} */
      const values = [];
      for (let i = 0; i < element.options.length; i++) {
        if (element.options[i].selected) {
          values.push(element.options[i].value);
        }
      }
      return { value: values };
    }
    return { value: element.value };
  }
};

/**
 * Syncfusion component value reader.
 * Handles Syncfusion EJ2 components via ej2_instances.
 */
export const SyncfusionValueReader = {
  /**
   * Check if this reader can handle the element.
   * @param {Element} element
   * @returns {boolean}
   */
  matches(element) {
    return hasSyncfusionInstance(element);
  },

  /**
   * Read value from a Syncfusion component.
   * @param {Element} element
   * @returns {{ value: unknown; skip?: boolean } | null}
   */
  getValue(element) {
    const result = getSyncfusionValue(element);
    if (!result) {
      return null;
    }

    if (result.isCheckbox) {
      // For form submission, unchecked checkboxes should not be included
      // Checked checkboxes submit 'true' (ASP.NET Core model binding convention)
      return result.value
        ? { value: 'true' }
        : { value: null, skip: true };
    }

    // Most Syncfusion components return their value directly
    // MultiSelect returns an array, which is handled correctly
    return { value: result.value };
  }
};

/**
 * Custom value reader for data-alis-value and data-alis-value-fn attributes.
 */
export const CustomValueReader = {
  /**
   * Check if element has custom value attribute.
   * @param {Element} element
   * @returns {boolean}
   */
  matches(element) {
    return (
      element.hasAttribute('data-alis-value') ||
      element.hasAttribute('data-alis-value-fn')
    );
  },

  /**
   * Read custom value from element.
   * @param {Element} element
   * @returns {{ value: unknown } | null}
   */
  getValue(element) {
    // Check for custom value selector: data-alis-value="#selector@attribute"
    const customValueAttr = element.getAttribute('data-alis-value');
    if (customValueAttr) {
      return { value: this.readFromSelector(customValueAttr) };
    }

    // Check for custom value function: data-alis-value-fn="functionName"
    const customValueFn = element.getAttribute('data-alis-value-fn');
    if (customValueFn && typeof window !== 'undefined') {
      const fn = /** @type {Record<string, unknown>} */ (window)[customValueFn];
      if (typeof fn === 'function') {
        return { value: fn(element) };
      }
    }

    return null;
  },

  /**
   * Read value from custom selector.
   * Format: "#selector@attribute" or "#selector .child@attribute"
   * If no @attribute, uses value or textContent.
   * @param {string} selectorAttr
   * @returns {string}
   */
  readFromSelector(selectorAttr) {
    if (!selectorAttr) return '';

    let selector = selectorAttr;
    let attribute = 'value'; // default

    // Check for @attribute suffix
    const atIndex = selectorAttr.lastIndexOf('@');
    if (atIndex > 0) {
      selector = selectorAttr.substring(0, atIndex);
      attribute = selectorAttr.substring(atIndex + 1);
    }

    const targetEl = document.querySelector(selector);
    if (!targetEl) return '';

    // Special handling for common attributes
    if (attribute === 'value' && 'value' in targetEl) {
      return /** @type {HTMLInputElement} */ (targetEl).value;
    }
    if (attribute === 'textContent') {
      return targetEl.textContent || '';
    }
    if (attribute === 'innerHTML') {
      return targetEl.innerHTML || '';
    }

    // Check for data-* attribute
    if (attribute.startsWith('data-')) {
      return targetEl.getAttribute(attribute) || '';
    }

    // Generic attribute
    return targetEl.getAttribute(attribute) || '';
  }
};

/**
 * Read value from any form element.
 * Checks readers in order: Custom > Syncfusion > Native
 *
 * @param {Element} element
 * @returns {{ name: string; value: unknown } | null}
 */
export function readValue(element) {
  if (!element || !element.getAttribute) {
    return null;
  }

  const name = element.getAttribute('name');
  if (!name || ('disabled' in element && /** @type {any} */ (element).disabled)) {
    return null;
  }

  // Check readers in priority order
  const readers = [CustomValueReader, SyncfusionValueReader, NativeValueReader];

  for (const reader of readers) {
    if (reader.matches(element)) {
      const result = reader.getValue(element);
      if (result) {
        if (result.skip) {
          return null;
        }
        return { name, value: result.value };
      }
    }
  }

  return null;
}

/**
 * Accumulate a value into an entries object.
 * Handles multiple values with same name by converting to array.
 * Arrays are flattened (MultiSelect returns array, we don't want nested arrays).
 *
 * @param {Record<string, any>} entries
 * @param {string} name
 * @param {unknown} value
 */
function accumulateValue(entries, name, value) {
  if (entries[name] === undefined) {
    entries[name] = value;
  } else {
    // Convert to array if not already
    if (!Array.isArray(entries[name])) {
      entries[name] = [entries[name]];
    }
    // Flatten arrays (e.g., MultiSelect value which is already an array)
    if (Array.isArray(value)) {
      entries[name].push(...value);
    } else {
      entries[name].push(value);
    }
  }
}

/**
 * Read all values from a form element.
 * @param {HTMLFormElement} form
 * @returns {Record<string, unknown>}
 */
export function readFormValues(form) {
  if (!(form instanceof HTMLFormElement)) {
    throw new TypeError('readFormValues expects a form element');
  }

  /** @type {Record<string, any>} */
  const entries = {};

  Array.from(form.elements).forEach(element => {
    const reading = readValue(element);
    if (!reading) {
      return;
    }
    accumulateValue(entries, reading.name, reading.value);
  });

  return entries;
}

/**
 * Read all values from a container element.
 * @param {Element} container
 * @returns {Record<string, unknown>}
 */
export function readContainerValues(container) {
  if (!(container instanceof Element)) {
    throw new TypeError('readContainerValues expects an Element');
  }

  /** @type {Record<string, any>} */
  const entries = {};

  const fields = container.querySelectorAll('[name]');
  fields.forEach(field => {
    const reading = readValue(field);
    if (!reading) {
      return;
    }
    accumulateValue(entries, reading.name, reading.value);
  });

  return entries;
}
