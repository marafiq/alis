const ACTIVE_REQUESTS = new Map();

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function coordinateStep(ctx) {
  const element = ctx.element;
  if (!element) {
    return ctx;
  }

  const key = element;
  const strategy = ctx.config.duplicateRequest || 'ignore';
  // keep silent in production – telemetry can be wired via hooks

  if (!ACTIVE_REQUESTS.has(key)) {
    ACTIVE_REQUESTS.set(key, { id: ctx.id, controller: ctx.abortController });
    return ctx;
  }

  switch (strategy) {
    case 'ignore':
      ctx.state.aborted = true;
      break;
    case 'abort-previous':
      {
        const prev = ACTIVE_REQUESTS.get(key);
        if (prev && prev.controller) {
          prev.controller.abort();
        }
        ACTIVE_REQUESTS.set(key, { id: ctx.id, controller: ctx.abortController });
      }
      break;
    case 'queue':
      // future enhancement
      break;
    default:
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
