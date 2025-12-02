/**
 * Syncfusion wrapper class names that indicate a component wrapper.
 */
const SYNCFUSION_WRAPPER_CLASSES = [
  'e-input-group',
  'e-control-wrapper',
  'e-checkbox-wrapper',
  'e-radio-wrapper'
];

/**
 * Determines if an element should be validated.
 * 
 * Checks:
 * 1. data-val="true" must be present
 * 2. Element must be visible (unless data-val-always="true")
 * 3. Element must not be disabled
 * 4. For hidden inputs, checks if Syncfusion wrapper is visible
 * 
 * @param {Element} element - The element to check
 * @returns {boolean} - Whether the element should be validated
 */
export function shouldValidate(element) {
  // Must have data-val="true"
  if (element.getAttribute('data-val') !== 'true') {
    return false;
  }
  
  // Disabled elements are skipped
  if (element instanceof HTMLInputElement && element.disabled) {
    return false;
  }
  if (element instanceof HTMLSelectElement && element.disabled) {
    return false;
  }
  if (element instanceof HTMLTextAreaElement && element.disabled) {
    return false;
  }
  
  // data-val-always="true" overrides visibility checks
  if (element.getAttribute('data-val-always') === 'true') {
    return true;
  }
  
  // Check if element is a hidden input
  if (element instanceof HTMLInputElement && element.type === 'hidden') {
    // For hidden inputs, check if there's a visible Syncfusion wrapper
    return hasSyncfusionVisibleWrapper(element);
  }
  
  // Check visibility
  return isVisible(element);
}

/**
 * Check if an element is visible.
 * @param {Element} element
 * @returns {boolean}
 */
function isVisible(element) {
  if (!(element instanceof HTMLElement)) {
    return true;
  }
  
  // Check computed style
  const style = window.getComputedStyle(element);
  
  if (style.display === 'none') {
    return false;
  }
  
  if (style.visibility === 'hidden') {
    return false;
  }
  
  return true;
}

/**
 * Check if a hidden input has a visible Syncfusion wrapper.
 * @param {Element} element
 * @returns {boolean}
 */
function hasSyncfusionVisibleWrapper(element) {
  // Look for parent with Syncfusion wrapper class
  let parent = element.parentElement;
  
  while (parent) {
    const hasSyncfusionClass = SYNCFUSION_WRAPPER_CLASSES.some(cls => 
      parent?.classList.contains(cls)
    );
    
    if (hasSyncfusionClass) {
      return isVisible(parent);
    }
    
    parent = parent.parentElement;
  }
  
  // No Syncfusion wrapper found, hidden input should not validate
  return false;
}

