import { createContextForElement } from './context.js';
import { runDefaultPipeline } from './pipeline.js';

/**
 * @param {Element} element
 * @param {Record<string, unknown> & { data?: unknown }} overrides
 * @param {Record<string, unknown>} globalConfig
 */
export function trigger(element, overrides = {}, globalConfig = {}) {
  const ctx = createContextForElement(element, overrides, globalConfig);
  return runDefaultPipeline(ctx);
}

