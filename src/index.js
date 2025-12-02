const VERSION = '0.0.0-dev';

const noop = () => {};

/**
 * @typedef {{ config: Record<string, unknown>; initializedAt: number }} InitResult
 */

const ALIS = {
  version: VERSION,
  /**
   * @param {Record<string, unknown>} config
   * @returns {InitResult}
   */
  init(config = {}) {
    return {
      config: structuredCloneSafe(config),
      initializedAt: Date.now()
    };
  },
  process() {
    return 0;
  },
  trigger() {
    throwNotImplemented('trigger');
  },
  request() {
    throwNotImplemented('request');
  },
  from() {
    return {
      execute() {
        throwNotImplemented('from().execute');
      }
    };
  },
  abort: noop,
  abortAll: noop,
  _internal: {
    noop
  }
};

/**
 * @param {string} name
 */
function throwNotImplemented(name) {
  throw new Error(`ALIS ${name} is not implemented yet`);
}

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export { ALIS };
export default ALIS;

if (typeof window !== 'undefined') {
  const win = /** @type {Window & typeof globalThis & { ALIS?: typeof ALIS }} */ (window);
  if (!win.ALIS) {
    win.ALIS = ALIS;
  }
}

