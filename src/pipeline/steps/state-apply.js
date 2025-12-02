/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function stateApplyStep(ctx) {
  ctx.stateManager?.apply();
  return ctx;
}

