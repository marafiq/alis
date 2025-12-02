import { request as requestApi } from './api/request.js';
import { trigger as triggerApi } from './api/trigger.js';
import { from as fromApi } from './api/from.js';
import { setupDelegation } from './trigger/delegation.js';
import { registerConfirm } from './confirm/registry.js';

const VERSION = '0.0.1';
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
    setupDelegation(undefined, (element, event, triggerElement, options) => {
      handleTrigger(element, { 
        triggerElement, 
        originEvent: event,
        debounced: options?.debounced 
      }).catch(error => {
        console.error('[ALIS] trigger failed', error);
      });
    });
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
 * Deep clone a value, preserving functions (which can't be cloned by structuredClone)
 * @template T
 * @param {T} value
 * @returns {T}
 */
function structuredCloneSafe(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return /** @type {T} */ (value.map(item => structuredCloneSafe(item)));
  }
  
  // Handle objects - shallow clone to preserve functions
  const result = /** @type {Record<string, unknown>} */ ({});
  for (const key of Object.keys(value)) {
    const val = /** @type {Record<string, unknown>} */ (value)[key];
    if (typeof val === 'function') {
      // Keep functions as-is (can't clone them)
      result[key] = val;
    } else if (val !== null && typeof val === 'object') {
      result[key] = structuredCloneSafe(val);
    } else {
      result[key] = val;
    }
  }
  return /** @type {T} */ (result);
}

export { ALIS };
export default ALIS;

if (typeof window !== 'undefined') {
  const win = /** @type {Window & typeof globalThis & { ALIS?: typeof ALIS }} */ (window);
  if (!win.ALIS) {
    win.ALIS = ALIS;
  }
}

