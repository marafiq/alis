/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function stateRestoreStep(ctx) {
  ctx.stateManager?.restore();
  return ctx;
}

