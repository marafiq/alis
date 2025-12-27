import { readContainerValues, readFormValues, readValue } from './reader.js';
import { resolveCollectSource } from './resolver.js';
import { hasSyncfusionInstance } from '../syncfusion/constants.js';

/**
 * Check if element should be treated as a single field for collection.
 * This includes elements with name attributes and Syncfusion components.
 *
 * @param {Element} element
 * @returns {boolean}
 */
function isSingleFieldElement(element) {
  // Direct name attribute
  if (element.getAttribute('name')) {
    return true;
  }
  // Syncfusion components might not have name directly on element
  // but readValue handles finding the name from hidden elements
  if (hasSyncfusionInstance(element)) {
    return true;
  }
  return false;
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

  // For self collection, treat element as single field if it has name or is Syncfusion
  if (source === element && element && isSingleFieldElement(element)) {
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

