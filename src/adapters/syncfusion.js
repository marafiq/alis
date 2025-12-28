/**
 * Syncfusion EJ2 Adapter for ALIS
 *
 * Handles all Syncfusion-specific value and name extraction.
 * ALIS core remains framework-agnostic.
 */

import { registerAdapter } from './registry.js';

/**
 * Get Syncfusion instance from element
 * @param {Element} element
 * @returns {any | null}
 */
function getInstance(element) {
  const instances = /** @type {any} */ (element)['ej2_instances'];
  return Array.isArray(instances) && instances.length > 0 ? instances[0] : null;
}

/** @type {import('./types').Adapter} */
const syncfusionAdapter = {
  name: 'syncfusion',

  canHandle(element) {
    return getInstance(element) !== null;
  },

  getFieldName(element) {
    const instance = getInstance(element);
    if (!instance) return null;

    // Syncfusion exposes name via instance.name
    if (instance.name) return instance.name;

    // Some controls use hiddenElement for form submission
    if (instance.hiddenElement?.getAttribute?.('name')) {
      return instance.hiddenElement.getAttribute('name');
    }

    // Fallback to element's name attribute
    return element.getAttribute('name');
  },

  getValue(element) {
    const instance = getInstance(element);
    if (!instance) return null;

    // Checkbox/Switch use 'checked'
    if ('checked' in instance) {
      return instance.checked;
    }

    // Most controls use 'value'
    if ('value' in instance) {
      return instance.value;
    }

    return null;
  },

  isCheckbox(element) {
    const instance = getInstance(element);
    return instance && 'checked' in instance;
  }
};

// Auto-register when imported
registerAdapter(syncfusionAdapter);

export { syncfusionAdapter };
