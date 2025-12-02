/**
 * Syncfusion wrapper class names.
 */
const WRAPPER_CLASSES = [
  'e-input-group',
  'e-control-wrapper',
  'e-checkbox-wrapper',
  'e-radio-wrapper'
];

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
    const instances = /** @type {unknown} */ (element)['ej2_instances'];
    return Array.isArray(instances) && instances.length > 0;
  },
  
  /**
   * Gets the value from Syncfusion component instance.
   * @param {Element} element
   * @returns {unknown}
   */
  getValue(element) {
    const instances = /** @type {unknown} */ (element)['ej2_instances'];
    if (!Array.isArray(instances) || instances.length === 0) {
      return null;
    }
    
    const instance = instances[0];
    
    // CheckBox uses 'checked' property
    if ('checked' in instance) {
      return instance.checked;
    }
    
    // Most components use 'value' property
    if ('value' in instance) {
      return instance.value;
    }
    
    return null;
  },
  
  /**
   * Returns the visible wrapper element for error styling.
   * @param {Element} element
   * @returns {Element}
   */
  getVisibleElement(element) {
    // Look for parent with Syncfusion wrapper class
    let parent = element.parentElement;
    
    while (parent) {
      const hasWrapperClass = WRAPPER_CLASSES.some(cls => 
        parent?.classList.contains(cls)
      );
      
      if (hasWrapperClass) {
        return parent;
      }
      
      parent = parent.parentElement;
    }
    
    return element;
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

