/**
 * ALIS Adapter Registry
 *
 * Adapters provide integration with UI frameworks (Syncfusion, Telerik, etc.)
 * without polluting ALIS core code.
 *
 * Each adapter implements:
 * - canHandle(element): boolean - does this adapter handle this element?
 * - getFieldName(element): string | null - get field name for the element
 * - getValue(element): unknown - get current value from the element
 * - isCheckbox(element): boolean - is this a checkbox-like control?
 */

/** @type {Array<import('./types').Adapter>} */
const adapters = [];

/**
 * Register an adapter for a UI framework
 * @param {import('./types').Adapter} adapter
 */
export function registerAdapter(adapter) {
  adapters.push(adapter);
}

/**
 * Find adapter that can handle this element
 * @param {Element} element
 * @returns {import('./types').Adapter | null}
 */
export function findAdapter(element) {
  for (const adapter of adapters) {
    if (adapter.canHandle(element)) {
      return adapter;
    }
  }
  return null;
}

/**
 * Get field name using registered adapters
 * @param {Element} element
 * @returns {string | null}
 */
export function getAdapterFieldName(element) {
  const adapter = findAdapter(element);
  return adapter?.getFieldName(element) ?? null;
}

/**
 * Get value using registered adapters
 * @param {Element} element
 * @returns {{ value: unknown; isCheckbox: boolean } | null}
 */
export function getAdapterValue(element) {
  const adapter = findAdapter(element);
  if (!adapter) return null;

  return {
    value: adapter.getValue(element),
    isCheckbox: adapter.isCheckbox?.(element) ?? false
  };
}

/**
 * Check if any adapter handles this element
 * @param {Element} element
 * @returns {boolean}
 */
export function hasAdapter(element) {
  return findAdapter(element) !== null;
}
