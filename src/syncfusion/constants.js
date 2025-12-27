/**
 * Syncfusion wrapper class patterns - these wrap actual input elements.
 * Used across the codebase for:
 * - Finding the original ALIS element for Syncfusion controls
 * - Error display styling
 * - Validation visibility checks
 */
export const SYNCFUSION_WRAPPER_CLASSES = [
  'e-input-group',
  'e-control-wrapper',
  'e-ddl',
  'e-numerictextbox',
  'e-datepicker',
  'e-checkbox-wrapper',
  'e-radio-wrapper'
];

/**
 * Syncfusion input class patterns - visible input elements created by Syncfusion.
 */
export const SYNCFUSION_INPUT_CLASSES = [
  'e-input',
  'e-dropdownlist',
  'e-numerictextbox',
  'e-datepicker'
];

/**
 * Check if element is a Syncfusion wrapper.
 * @param {Element} element
 * @returns {boolean}
 */
export function isSyncfusionWrapper(element) {
  return SYNCFUSION_WRAPPER_CLASSES.some(cls => element.classList.contains(cls));
}

/**
 * Check if element is a Syncfusion input.
 * @param {Element} element
 * @returns {boolean}
 */
export function isSyncfusionInput(element) {
  return SYNCFUSION_INPUT_CLASSES.some(cls => element.classList.contains(cls));
}

/**
 * Find Syncfusion wrapper for an element.
 * @param {Element} element
 * @returns {Element | null}
 */
export function findSyncfusionWrapper(element) {
  let parent = element.parentElement;

  while (parent) {
    if (isSyncfusionWrapper(parent)) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return null;
}
