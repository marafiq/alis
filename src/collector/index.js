import { readContainerValues, readFormValues, readValue } from './reader.js';
import { resolveCollectSource } from './resolver.js';
import { hasAdapter } from '../adapters/registry.js';

/**
 * Check if element is a collectable field (has name or handled by adapter)
 * @param {Element} element
 * @returns {boolean}
 */
function isCollectableField(element) {
  return !!element.getAttribute('name') || hasAdapter(element);
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

  // For self collection, treat as single field if collectable
  if (source === element && element && isCollectableField(element)) {
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
