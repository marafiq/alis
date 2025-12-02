import { createContext } from '../pipeline/context.js';
import { runDefaultPipeline } from './pipeline.js';
import { extractData } from './context.js';

/**
 * @param {Record<string, unknown> & { data?: unknown }} options
 * @param {Record<string, unknown>} globalConfig
 */
export function request(options = {}, globalConfig = {}) {
  const config = { ...globalConfig, ...options };
  const ctx = createContext(null, { config });
  const data = extractData(options);
  if (data !== undefined) {
    ctx.collect = { source: null, data };
  }
  return runDefaultPipeline(ctx);
}

