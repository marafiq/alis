import { getSwapStrategy } from '../../registry/swap.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function swapStep(ctx) {
  if (typeof ctx.config.target !== 'string' || ctx.body == null) {
    return ctx;
  }

  const selector = ctx.config.target.startsWith('#') ? ctx.config.target : `#${ctx.config.target}`;
  const target = document.querySelector(selector);
  if (!target) {
    return ctx;
  }

  const strategyName = typeof ctx.config.swap === 'string' ? ctx.config.swap : 'innerHTML';
  const strategy = getSwapStrategy(strategyName);
  strategy(target, typeof ctx.body === 'string' ? ctx.body : JSON.stringify(ctx.body));

  return ctx;
}

