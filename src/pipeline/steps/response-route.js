import { emit } from '../../telemetry/emitter.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function responseRouteStep(ctx) {
  // Skip if there's already an error (e.g., from validation) or no response
  if (ctx.error || !ctx.response) {
    ctx.success = false;
    return ctx;
  }

  const status = ctx.response.status;
  if (status >= 200 && status < 300) {
    ctx.success = true;
    emit('response:route', { id: ctx.id, status: 'success' });
    return ctx;
  }

  if (ctx.validation) {
    emit('response:route', { id: ctx.id, status: 'validation-error' });
  } else {
    emit('response:route', { id: ctx.id, status: 'error' });
  }

  ctx.success = false;
  return ctx;
}

