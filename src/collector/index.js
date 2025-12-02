import { readContainerValues, readFormValues, readValue } from './reader.js';
import { resolveCollectSource } from './resolver.js';

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

  if (source === element && element && element.getAttribute('name')) {
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

