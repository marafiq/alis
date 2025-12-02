/**
 * @template T
 * @param {{ name?: string; allowOverride?: boolean }} [options]
 */
export function createRegistry({ name = 'registry', allowOverride = false } = {}) {
  /** @type {Map<string, T>} */
  const store = new Map();

  /**
   * @param {string} key
   */
  function assertKey(key) {
    if (typeof key !== 'string' || key.trim() === '') {
      throw new TypeError(`${name}: key must be a non-empty string`);
    }
  }

  /**
   * @param {string} key
   * @param {T} value
   * @param {{ override?: boolean }} [options]
   */
  function register(key, value, options = {}) {
    assertKey(key);
    if (value == null) {
      throw new TypeError(`${name}: value is required for "${key}"`);
    }

    const exists = store.has(key);
    const canOverride = allowOverride || Boolean(options.override);
    if (exists && !canOverride) {
      throw new Error(`${name}: "${key}" already registered`);
    }

    store.set(key, value);
    return value;
  }

  /**
   * @param {string} key
   */
  function get(key) {
    assertKey(key);
    return store.get(key);
  }

  /**
   * @param {string} key
   */
  function has(key) {
    assertKey(key);
    return store.has(key);
  }

  /**
   * @param {string} key
   */
  function unregister(key) {
    assertKey(key);
    return store.delete(key);
  }

  function clear() {
    store.clear();
  }

  function keys() {
    return Array.from(store.keys());
  }

  function entries() {
    return Array.from(store.entries());
  }

  return Object.freeze({
    register,
    get,
    has,
    unregister,
    clear,
    keys,
    entries
  });
}

