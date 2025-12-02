import { collect } from '../../collector/index.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function collectStep(ctx) {
  const collectOption = typeof ctx.config.collect === 'string' ? ctx.config.collect : undefined;
  const result = collect(ctx.element, { collect: collectOption });
  ctx.collect = result;
  return ctx;
}

