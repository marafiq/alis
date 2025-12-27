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

/**
 * Check if element has Syncfusion ej2_instances.
 * @param {Element} element
 * @returns {boolean}
 */
export function hasSyncfusionInstance(element) {
  const instances = /** @type {any} */ (element)['ej2_instances'];
  return Array.isArray(instances) && instances.length > 0;
}

/**
 * Get the Syncfusion component instance for an element.
 * @param {Element} element
 * @returns {any | null}
 */
export function getSyncfusionInstance(element) {
  const instances = /** @type {any} */ (element)['ej2_instances'];
  if (!Array.isArray(instances) || instances.length === 0) {
    return null;
  }
  return instances[0];
}

/**
 * Get value from a Syncfusion component.
 * Returns the raw value from the component instance.
 * - CheckBox/Switch: returns boolean (checked state)
 * - Other components: returns the value property
 *
 * @param {Element} element
 * @returns {{ value: unknown; isCheckbox: boolean } | null}
 */
export function getSyncfusionValue(element) {
  const instance = getSyncfusionInstance(element);
  if (!instance) {
    return null;
  }

  // CheckBox and Switch use 'checked' property
  if ('checked' in instance) {
    return { value: instance.checked, isCheckbox: true };
  }

  // Most components use 'value' property
  if ('value' in instance) {
    return { value: instance.value, isCheckbox: false };
  }

  return null;
}
