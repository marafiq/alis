import { createStateManager } from '../../state/manager.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function stateCaptureStep(ctx) {
  if (!ctx.element) {
    return ctx;
  }

  const indicator = typeof ctx.config.indicator === 'string' ? ctx.config.indicator : undefined;

  ctx.stateManager = createStateManager(ctx.element, {
    indicator
  });

  return ctx;
}

