import { findSyncfusionWrapper, hasSyncfusionInstance, getSyncfusionValue } from '../../syncfusion/constants.js';

/**
 * Adapter for Syncfusion Essential JS 2 components.
 * Syncfusion components render hidden inputs with ej2_instances array.
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
   * @param {Element} element
   * @returns {Element}
   */
  getVisibleElement(element) {
    return findSyncfusionWrapper(element) || element;
  },
  
  /**
   * Returns the focusable element for blur events.
   * @param {Element} element
   * @returns {Element}
   */
  getBlurTarget(element) {
    // Look for the visible input element within the wrapper
    const wrapper = SyncfusionAdapter.getVisibleElement(element);
    
    // Try common Syncfusion focusable element selectors
    const focusable = wrapper.querySelector('.e-input, .e-checkbox, .e-radio, input:not([type="hidden"])');
    
    return focusable || element;
  }
};

