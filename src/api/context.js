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
  return config;
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

