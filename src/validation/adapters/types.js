/**
 * @typedef {Object} Adapter
 * @property {string} name - Unique adapter name
 * @property {(element: Element) => boolean} matches - Returns true if this adapter handles the element
 * @property {(element: Element) => unknown} getValue - Extracts the value from the element
 * @property {(element: Element) => Element} getVisibleElement - Returns the visible element for error styling
 * @property {(element: Element) => Element} getBlurTarget - Returns the element to attach blur events to
 */

export {};

