import { createRegistry } from '../registry/base.js';

const registry = createRegistry({ name: 'ALIS.confirm', allowOverride: true });

/**
 * @param {string} name
 * @param {(ctx: import('../pipeline/context.js').PipelineContext) => Promise<boolean> | boolean} handler
 */
export function registerConfirm(name, handler) {
  return registry.register(name, handler, { override: true });
}

/**
 * @param {string} name
 * @param {import('../pipeline/context.js').PipelineContext} ctx
 */
export async function executeConfirm(name, ctx) {
  const handler = registry.get(name);
  if (!handler) {
    throw new Error(`Confirm handler "${name}" not found`);
  }
  return handler(ctx);
}

export function clearConfirms() {
  registry.clear();
}

