import { createContextForElement } from './context.js';
import { runDefaultPipeline } from './pipeline.js';

/**
 * @param {Element} element
 * @param {Record<string, unknown>} globalConfig
 */
export function from(element, globalConfig = {}) {
  return {
    execute(overrides = {}) {
      const ctx = createContextForElement(element, overrides, globalConfig);
      return runDefaultPipeline(ctx);
    }
  };
}

