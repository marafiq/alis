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

  if (!ACTIVE_REQUESTS.has(key)) {
    ACTIVE_REQUESTS.set(key, ctx.id);
    return ctx;
  }

  switch (strategy) {
    case 'ignore':
      ctx.state.aborted = true;
      break;
    case 'abort-previous':
      ACTIVE_REQUESTS.set(key, ctx.id);
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
export function completeCoordinate(ctx) {
  if (ctx.element && ACTIVE_REQUESTS.get(ctx.element) === ctx.id) {
    ACTIVE_REQUESTS.delete(ctx.element);
  }
}

