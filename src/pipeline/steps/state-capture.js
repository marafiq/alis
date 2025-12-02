import { createStateManager } from '../../state/manager.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function stateCaptureStep(ctx) {
  const target =
    ctx.config.triggerElement && ctx.config.triggerElement instanceof Element
      ? ctx.config.triggerElement
      : ctx.element;

  if (!target) {
    return ctx;
  }

  const indicator = typeof ctx.config.indicator === 'string' ? ctx.config.indicator : undefined;

  ctx.stateManager = createStateManager(target, {
    indicator
  });

  return ctx;
}

