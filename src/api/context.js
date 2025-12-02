import { createContext } from '../pipeline/context.js';
import { getAllAttributes, getMethodAndUrl } from '../utils/attribute-reader.js';
import { executeConfirm } from '../confirm/registry.js';
import { executeElementConfirm } from '../confirm/element.js';

/**
 * @typedef {Record<string, unknown> & { data?: unknown }} OverrideConfig
 */

/**
 * @param {Element} element
 * @param {OverrideConfig} overrides
 * @param {Record<string, unknown>} globalConfig
 */
export function createContextForElement(element, overrides = {}, globalConfig = {}) {
  const attrConfig = buildConfigFromAttributes(element);
  const mergedConfig = {
    ...globalConfig,
    ...attrConfig,
    ...overrides
  };

  const ctx = createContext(element, { config: mergedConfig });
  const data = extractData(overrides);
  if (data !== undefined) {
    ctx.collect = { source: element, data };
  }
  return ctx;
}

/**
 * @param {Element} element
 */
export function buildConfigFromAttributes(element) {
  if (!element) return {};
  const attrs = getAllAttributes(element);
  const config = /** @type {Record<string, unknown>} */ ({});
  
  // Extract URL and method from element (form action/method or data-alis-{method})
  try {
    const { method, url } = getMethodAndUrl(element);
    config.method = method;
    config.url = url;
  } catch {
    // Element might not have method/url attributes yet (will be validated later)
  }
  
  if (attrs.target) config.target = attrs.target;
  if (attrs.collect) config.collect = attrs.collect;
  if (attrs.indicator) config.indicator = attrs.indicator;
  if (attrs.swap) config.swap = attrs.swap;
  if (attrs.serialize) config.serialize = attrs.serialize;
  if (attrs.encoding) config.encoding = attrs.encoding;
  const concurrencyAttr = attrs.concurrency || attrs['duplicate-request'];
  if (concurrencyAttr) {
    config.duplicateRequest = concurrencyAttr;
  }
  if (attrs.retry) config.retry = parseRetry(attrs.retry);
  if (attrs.confirm) {
    const confirmHandler =
      /** @type {(ctx: import('../pipeline/context.js').PipelineContext) => Promise<boolean> | boolean} */ (
        ctx => executeConfirm(attrs.confirm, ctx)
      );
    config.confirm = confirmHandler;
  } else if (element?.hasAttribute('data-alis-confirm-message')) {
    const confirmFallback =
      /** @param {import('../pipeline/context.js').PipelineContext} ctx */
      (ctx) => executeElementConfirm(element, ctx);
    config.confirm = confirmFallback;
  }
  if (attrs.trigger) config.trigger = attrs.trigger;
  
  // Parse onBefore and onAfter hooks from attributes
  // Format: data-alis-on-before="functionName" or data-alis-on-after="fn1, fn2"
  if (attrs['on-before']) {
    config.onBefore = parseHooks(attrs['on-before']);
  }
  if (attrs['on-after']) {
    config.onAfter = parseHooks(attrs['on-after']);
  }
  
  return config;
}

/**
 * Parse hook attribute value into array of functions
 * @param {string} value - Comma-separated function names
 * @returns {Array<(ctx: import('../pipeline/context.js').PipelineContext) => void>}
 */
function parseHooks(value) {
  if (!value || typeof window === 'undefined') return [];
  
  return value.split(',')
    .map(name => name.trim())
    .filter(Boolean)
    .map(name => {
      const fn = /** @type {Record<string, unknown>} */ (window)[name];
      if (typeof fn === 'function') {
        return /** @type {(ctx: import('../pipeline/context.js').PipelineContext) => void} */ (fn);
      }
      console.warn(`[ALIS] Hook function "${name}" not found on window`);
      return null;
    })
    .filter(/** @type {(fn: unknown) => fn is Function} */ (fn => fn !== null));
}

/**
 * @param {string} value
 */
function parseRetry(value) {
  if (value === 'false') return false;
  if (value === 'true') return true;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * @param {Record<string, unknown>} source
 */
export function extractData(source) {
  if (source && Object.prototype.hasOwnProperty.call(source, 'data')) {
    return /** @type {{ data?: unknown }} */ (source).data;
  }
  return undefined;
}

