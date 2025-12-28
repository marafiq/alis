import { hasSyncfusionInstance, getSyncfusionInstance, getSyncfusionValue, getSyncfusionVisibleElement } from '../../syncfusion/constants.js';

/**
 * Adapter for Syncfusion Essential JS 2 components.
 * Syncfusion components render hidden inputs with ej2_instances array.
 * All detection uses instance properties, not CSS classes.
 * @type {import('./types.js').Adapter}
 */
export const SyncfusionAdapter = {
  name: 'syncfusion',

  /**
   * Returns true if element has ej2_instances array.
   * @param {Element} element
   * @returns {boolean}
   */
  matches(element) {
    return hasSyncfusionInstance(element);
  },

  /**
   * Gets the value from Syncfusion component instance.
   * For validation, returns the raw value (boolean for checkboxes).
   * @param {Element} element
   * @returns {unknown}
   */
  getValue(element) {
    const result = getSyncfusionValue(element);
    return result ? result.value : null;
  },

  /**
   * Returns the visible wrapper element for error styling.
   * Uses instance.inputWrapper or instance.wrapper properties.
   * @param {Element} element
   * @returns {Element}
   */
  getVisibleElement(element) {
    return getSyncfusionVisibleElement(element);
  },

  /**
   * Returns the focusable element for blur events.
   * Uses instance.inputElement or instance.element properties.
   * @param {Element} element
   * @returns {Element}
   */
  getBlurTarget(element) {
    const instance = getSyncfusionInstance(element);
    if (!instance) {
      return element;
    }

    // Syncfusion exposes the input element through instance properties
    if (instance.inputElement instanceof Element) {
      return instance.inputElement;
    }
    if (instance.element instanceof Element) {
      return instance.element;
    }

    return element;
  }
};

