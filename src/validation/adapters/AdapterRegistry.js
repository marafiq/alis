import { DefaultAdapter } from './DefaultAdapter.js';

/**
 * @typedef {import('./types.js').Adapter} Adapter
 */

/**
 * Registry for validation adapters.
 * Adapters handle value extraction and visibility for different component types.
 */
export class AdapterRegistry {
  /** @type {Adapter[]} */
  #adapters = [];

  constructor() {
    // DefaultAdapter is always available as fallback
  }

  /**
   * Register an adapter.
   * @param {Adapter} adapter
   */
  register(adapter) {
    this.#adapters.push(adapter);
  }

  /**
   * Check if an adapter is registered by name.
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this.#adapters.some(a => a.name === name);
  }

  /**
   * Get the appropriate adapter for an element.
   * Returns the first matching adapter, or DefaultAdapter if none match.
   * @param {Element} element
   * @returns {Adapter}
   */
  getAdapter(element) {
    for (const adapter of this.#adapters) {
      if (adapter.matches(element)) {
        return adapter;
      }
    }
    return DefaultAdapter;
  }
}

