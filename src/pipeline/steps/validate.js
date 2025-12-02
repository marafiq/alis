import { ConfigError } from '../../errors/types.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function validateStep(ctx) {
  const { config, element } = ctx;

  if (!config || typeof config !== 'object') {
    throw new ConfigError('Missing configuration', { ctx });
  }

  if (!element) {
    throw new ConfigError('Missing element reference', { id: ctx.id });
  }

  return ctx;
}

