import { collect } from '../../collector/index.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function collectStep(ctx) {
  if (ctx.error) {
    return ctx;
  }

  const collectOption = typeof ctx.config.collect === 'string' ? ctx.config.collect : undefined;
  ctx.collect = collect(ctx.element, { collect: collectOption });
  return ctx;
}

