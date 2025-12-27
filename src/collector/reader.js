import { getAdapterFieldName, getAdapterValue, hasAdapter } from '../adapters/registry.js';

/**
 * Get field name from element.
 * Uses registered adapters for UI framework controls.
 * @param {Element} element
 * @returns {string | null}
 */
function getFieldName(element) {
  // Standard HTML name attribute
  const name = element.getAttribute('name');
  if (name) return name;

  // Check registered adapters (Syncfusion, etc.)
  return getAdapterFieldName(element);
}

/**
 * Read value from a form field element.
 * Supports native HTML elements, Syncfusion components, and custom value attributes.
 *
 * @param {Element} element
 * @returns {{ name: string; value: unknown } | null}
 */
export function readValue(element) {
  const name = getFieldName(element);
  if (!name) {
    return null;
  }

  if ('disabled' in element && /** @type {HTMLInputElement} */ (element).disabled) {
    return null;
  }

  // Custom value via selector
  const customSelector = element.getAttribute('data-alis-value');
  if (customSelector) {
    return { name, value: readValueFromSelector(customSelector) };
  }

  // Custom value via function
  const customFn = element.getAttribute('data-alis-value-fn');
  if (customFn) {
    const fn = /** @type {Record<string, unknown>} */ (window)[customFn];
    if (typeof fn === 'function') {
      return { name, value: fn(element) };
    }
  }

  // UI framework adapters (Syncfusion, etc.) - check BEFORE native elements
  if (hasAdapter(element)) {
    const adapterValue = getAdapterValue(element);
    if (adapterValue) {
      if (adapterValue.isCheckbox) {
        return adapterValue.value ? { name, value: 'true' } : null;
      }
      return { name, value: adapterValue.value };
    }
  }

  // Native HTML elements
  if (element instanceof HTMLInputElement) {
    return readInputValue(name, element);
  }

  if (element instanceof HTMLSelectElement) {
    return readSelectValue(name, element);
  }

  if (element instanceof HTMLTextAreaElement) {
    return { name, value: element.value };
  }

  if (element instanceof HTMLButtonElement) {
    return { name, value: element.value };
  }

  return null;
}

/**
 * @param {string} name
 * @param {HTMLInputElement} input
 * @returns {{ name: string; value: unknown } | null}
 */
function readInputValue(name, input) {
  switch (input.type) {
    case 'checkbox':
      return input.checked ? { name, value: input.value || 'on' } : null;

    case 'radio':
      return input.checked ? { name, value: input.value } : null;

    case 'file': {
      const files = input.files;
      if (!files || files.length === 0) {
        return null;
      }
      return { name, value: input.multiple ? Array.from(files) : files[0] };
    }

    default:
      return { name, value: input.value };
  }
}

/**
 * @param {string} name
 * @param {HTMLSelectElement} select
 * @returns {{ name: string; value: string | string[] }}
 */
function readSelectValue(name, select) {
  if (select.multiple) {
    /** @type {string[]} */
    const values = [];
    for (const option of select.options) {
      if (option.selected) {
        values.push(option.value);
      }
    }
    return { name, value: values };
  }
  return { name, value: select.value };
}

/**
 * Read value from a custom selector.
 * Format: "#selector" or "#selector@attribute"
 *
 * @param {string} selectorAttr
 * @returns {string}
 */
function readValueFromSelector(selectorAttr) {
  const atIndex = selectorAttr.lastIndexOf('@');
  const selector = atIndex > 0 ? selectorAttr.substring(0, atIndex) : selectorAttr;
  const attribute = atIndex > 0 ? selectorAttr.substring(atIndex + 1) : 'value';

  const target = document.querySelector(selector);
  if (!target) {
    return '';
  }

  if (attribute === 'value' && 'value' in target) {
    return /** @type {HTMLInputElement} */ (target).value;
  }

  if (attribute === 'textContent') {
    return target.textContent || '';
  }

  return target.getAttribute(attribute) || '';
}

/**
 * Accumulate a value into entries. Handles duplicate names by creating arrays.
 *
 * @param {Record<string, unknown>} entries
 * @param {string} name
 * @param {unknown} value
 */
function accumulateValue(entries, name, value) {
  const existing = entries[name];

  if (existing === undefined) {
    entries[name] = value;
    return;
  }

  // Convert to array and append
  const asArray = Array.isArray(existing) ? existing : [existing];
  if (Array.isArray(value)) {
    asArray.push(...value);
  } else {
    asArray.push(value);
  }
  entries[name] = asArray;
}

/**
 * Read all values from a form.
 *
 * @param {HTMLFormElement} form
 * @returns {Record<string, unknown>}
 */
export function readFormValues(form) {
  /** @type {Record<string, unknown>} */
  const entries = {};

  for (const element of form.elements) {
    const reading = readValue(element);
    if (reading) {
      accumulateValue(entries, reading.name, reading.value);
    }
  }

  return entries;
}

/**
 * Read all values from a container element.
 *
 * @param {Element} container
 * @returns {Record<string, unknown>}
 */
export function readContainerValues(container) {
  /** @type {Record<string, unknown>} */
  const entries = {};

  for (const field of container.querySelectorAll('[name]')) {
    const reading = readValue(field);
    if (reading) {
      accumulateValue(entries, reading.name, reading.value);
    }
  }

  return entries;
}
