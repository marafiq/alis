const METHODS = Object.freeze(['get', 'post', 'put', 'patch', 'delete']);
const ALIS_SELECTOR = '[data-alis]';

const DEFAULTS = deepFreeze({
  timeout: 30_000,
  credentials: 'same-origin',
  retry: {
    maxAttempts: 3,
    statusCodes: [408, 429, 500, 502, 503, 504],
    baseDelay: 1_000,
    maxDelay: 30_000,
    jitter: 0.2
  },
  duplicateRequest: 'ignore',
  errors: {
    handlerThrows: 'continue',
    targetNotFound: 'warn',
    collectFails: 'abort',
    duplicateRequest: 'ignore'
  },
  telemetry: 'none'
});

/**
 * @template T extends Record<string, unknown>
 * @param {T} target
 * @returns {Readonly<T>}
 */
function deepFreeze(target) {
  const record = /** @type {Record<string, unknown>} */ (target);
  Object.getOwnPropertyNames(record).forEach(prop => {
    const value = record[prop];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  return Object.freeze(target);
}

export { DEFAULTS, METHODS, ALIS_SELECTOR };

