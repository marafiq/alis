/**
 * @typedef {Object} Adapter
 * @property {string} name - Adapter name for debugging
 * @property {(element: Element) => boolean} canHandle - Check if adapter handles this element
 * @property {(element: Element) => string | null} getFieldName - Get field name
 * @property {(element: Element) => unknown} getValue - Get current value
 * @property {(element: Element) => boolean} [isCheckbox] - Is this a checkbox-like control
 */

export {};
