import { ConfigError } from '../../errors/types.js';

/**
 * Validates pipeline configuration.
 * Sets ctx.error if validation fails.
 *
 * @param {import('../context.js').PipelineContext} ctx
 */
export function validateStep(ctx) {
  if (!ctx.config || typeof ctx.config !== 'object') {
    ctx.error = new ConfigError('Missing configuration');
    return ctx;
  }

  if (!ctx.config.url) {
    ctx.error = new ConfigError('Missing URL in configuration');
    return ctx;
  }

  return ctx;
}
