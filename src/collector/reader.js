/**
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

  // Check for custom value selector: data-alis-value="#selector@attribute"
  const customValueAttr = element.getAttribute('data-alis-value');
  if (customValueAttr) {
    const value = readCustomValue(customValueAttr);
    return { name, value };
  }

  // Check for custom value function: data-alis-value-fn="functionName"
  const customValueFn = element.getAttribute('data-alis-value-fn');
  if (customValueFn && typeof window !== 'undefined') {
    const fn = /** @type {Record<string, unknown>} */ (window)[customValueFn];
    if (typeof fn === 'function') {
      return { name, value: fn(element) };
    }
  }

  // Check for Syncfusion component (ej2_instances array)
  const ej2Instances = /** @type {any} */ (element)['ej2_instances'];
  if (Array.isArray(ej2Instances) && ej2Instances.length > 0) {
    const instance = ej2Instances[0];
    // CheckBox uses 'checked' property
    if ('checked' in instance) {
      return instance.checked ? { name, value: 'true' } : null;
    }
    // Most components use 'value' property
    if ('value' in instance) {
      return { name, value: instance.value };
    }
  }

  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox') {
      return element.checked ? { name, value: element.value || 'on' } : null;
    }
    if (element.type === 'radio') {
      return element.checked ? { name, value: element.value } : null;
    }
    return { name, value: element.value };
  }

  if (element instanceof HTMLSelectElement) {
    if (element.multiple) {
      const values = Array.from(element.selectedOptions).map(option => option.value);
      return { name, value: values };
    }
    return { name, value: element.value };
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
 * Read value from custom selector
 * Format: "#selector@attribute" or "#selector .child@attribute"
 * If no @attribute, uses textContent
 * 
 * @param {string} selectorAttr
 * @returns {string}
 */
function readCustomValue(selectorAttr) {
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

/**
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
    const { name, value } = reading;
    if (entries[name] === undefined) {
      entries[name] = value;
    } else if (Array.isArray(entries[name])) {
      entries[name].push(value);
    } else {
      entries[name] = [entries[name], value];
    }
  });
  return entries;
}

/**
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
    if (reading) {
      entries[reading.name] = reading.value;
    }
  });
  return entries;
}

