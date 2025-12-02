import { request as requestApi } from './api/request.js';
import { trigger as triggerApi } from './api/trigger.js';
import { from as fromApi } from './api/from.js';
import { setupDelegation } from './trigger/delegation.js';
import { registerConfirm } from './confirm/registry.js';

const VERSION = '0.0.0-dev';
/** @type {Record<string, unknown>} */
let globalConfig = {};

/**
 * @param {Element} element
 * @param {Record<string, unknown>} overrides
 */
function handleTrigger(element, overrides = {}) {
  return triggerApi(element, overrides, globalConfig);
}

/**
 * @param {Record<string, unknown>} options
 */
function handleRequest(options = {}) {
  return requestApi(options, globalConfig);
}

/**
 * @param {Element} element
 */
function handleFrom(element) {
  return fromApi(element, globalConfig);
}

const ALIS = {
  version: VERSION,
  init(config = {}) {
    globalConfig = structuredCloneSafe(config);
    setupDelegation();
    return {
      config: structuredCloneSafe(globalConfig),
      initializedAt: Date.now()
    };
  },
  process() {
    return 0;
  },
  trigger: handleTrigger,
  request: handleRequest,
  from: handleFrom,
  confirm: {
    register: registerConfirm
  }
};

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

