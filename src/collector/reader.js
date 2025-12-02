/**
 * @param {Element} element
 * @returns {{ name: string; value: unknown } | null}
 */
export function readValue(element) {
  if (!element || !element.getAttribute) {
    return null;
  }

  const name = element.getAttribute('name');
  if (!name || ('disabled' in element && element.disabled)) {
    return null;
  }

  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox') {
      return element.checked ? { name, value: element.value || true } : null;
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

  return null;
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

