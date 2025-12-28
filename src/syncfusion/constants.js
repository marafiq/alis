/**
 * Syncfusion Integration Utilities
 *
 * This module provides utilities for integrating with Syncfusion EJ2 components.
 * All detection and value access is done through the Syncfusion instance (ej2_instances)
 * rather than CSS class detection, which is fragile and can break with updates.
 */

/**
 * Check if element has Syncfusion ej2_instances.
 * This is the authoritative way to detect Syncfusion components.
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

/**
 * Get the visible wrapper element for a Syncfusion component.
 * Uses instance properties (inputWrapper, wrapper) instead of class detection.
 * @param {Element} element
 * @returns {Element}
 */
export function getSyncfusionVisibleElement(element) {
  const instance = getSyncfusionInstance(element);
  if (!instance) {
    return element;
  }

  // Syncfusion components expose their wrapper through instance properties:
  // - inputWrapper: { container } for input-based controls (TextBox, NumericTextBox, etc.)
  // - wrapper: for other controls (CheckBox, etc.)
  if (instance.inputWrapper?.container instanceof Element) {
    return instance.inputWrapper.container;
  }
  if (instance.wrapper instanceof Element) {
    return instance.wrapper;
  }

  // Fallback to the element itself
  return element;
}

/**
 * Check if element is a visible Syncfusion input (not the hidden original).
 * Uses instance properties to find the visible input element.
 * @param {Element} element
 * @returns {boolean}
 */
export function isSyncfusionInput(element) {
  // Check if this element is a Syncfusion component directly
  if (hasSyncfusionInstance(element)) {
    return true;
  }

  // Check if this is the visible input within a Syncfusion wrapper
  // by looking for a parent/sibling with ej2_instances
  const parent = element.closest('[id]');
  if (parent && hasSyncfusionInstance(parent)) {
    const instance = getSyncfusionInstance(parent);
    // Check if this element is the visible input from the instance
    if (instance?.element === element || instance?.inputElement === element) {
      return true;
    }
  }

  return false;
}

/**
 * Find Syncfusion wrapper for an element using instance properties.
 * @param {Element} element
 * @returns {Element | null}
 */
export function findSyncfusionWrapper(element) {
  // First check if element itself has an instance
  if (hasSyncfusionInstance(element)) {
    const visible = getSyncfusionVisibleElement(element);
    return visible !== element ? visible : null;
  }

  // Walk up to find a parent with Syncfusion instance
  let parent = element.parentElement;
  while (parent) {
    if (hasSyncfusionInstance(parent)) {
      return getSyncfusionVisibleElement(parent);
    }
    parent = parent.parentElement;
  }

  return null;
}

