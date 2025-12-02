/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export async function confirmStep(ctx) {
  const confirmHandler = ctx.config.confirm;
  if (typeof confirmHandler !== 'function') {
    return ctx;
  }

  const confirmResult = await confirmHandler(ctx);
  if (confirmResult === false) {
    ctx.state.aborted = true;
  }
  return ctx;
}

