import { ConfigError } from '../../errors/types.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function validateStep(ctx) {
  const { config } = ctx;

  if (!config || typeof config !== 'object') {
    throw new ConfigError('Missing configuration', { ctx });
  }

  // URL is required for any request
  if (!config.url) {
    throw new ConfigError('Missing URL in configuration', { id: ctx.id });
  }

  // Element is optional for programmatic API (ALIS.request)
  // but required for declarative (data-alis) usage

  return ctx;
}

