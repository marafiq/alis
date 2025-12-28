const ACTIVE_REQUESTS = new Map();

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function coordinateStep(ctx) {
  const element = ctx.element;
  if (!element) {
    return ctx;
  }

  const strategy = ctx.config.duplicateRequest || 'ignore';

  if (!ACTIVE_REQUESTS.has(element)) {
    ACTIVE_REQUESTS.set(element, { id: ctx.id, controller: ctx.abortController });
    return ctx;
  }

  if (strategy === 'abort-previous') {
    const prev = ACTIVE_REQUESTS.get(element);
    if (prev?.controller) {
      prev.controller.abort();
    }
    ACTIVE_REQUESTS.set(element, { id: ctx.id, controller: ctx.abortController });
  } else {
    ctx.state.aborted = true;
  }

  return ctx;
}

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function coordinateCleanupStep(ctx) {
  const entry = ACTIVE_REQUESTS.get(ctx.element);
  if (ctx.element && entry && entry.id === ctx.id) {
    ACTIVE_REQUESTS.delete(ctx.element);
  }
  return ctx;
}
