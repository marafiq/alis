import { readContainerValues, readFormValues, readValue } from './reader.js';
import { resolveCollectSource } from './resolver.js';

/**
 * Check if element has a field name (via name attribute or data-alis-sf-name from bridge)
 * @param {Element} element
 * @returns {boolean}
 */
function hasFieldName(element) {
  return !!(element.getAttribute('name') || element.getAttribute('data-alis-sf-name'));
}

/**
 * @param {Element | null} element
 * @param {{ collect?: string }} options
 */
export function collect(element, options = {}) {
  const source = resolveCollectSource(element, options.collect);
  if (!source) {
    return { data: null, source: null };
  }

  if (source instanceof HTMLFormElement) {
    return {
      source,
      data: readFormValues(source)
    };
  }

  // For self collection, treat element as single field if it has a name
  if (source === element && element && hasFieldName(element)) {
    const field = readValue(element);
    return {
      source: element,
      data: field ? { [field.name]: field.value } : null
    };
  }

  return {
    source,
    data: readContainerValues(source)
  };
}
