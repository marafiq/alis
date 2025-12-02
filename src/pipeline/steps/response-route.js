import { emit } from '../../telemetry/emitter.js';
import { ALISError } from '../../errors/types.js';

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

  // Set ctx.error for non-2xx responses so hooks can check ctx.error consistently
  if (ctx.validation) {
    // Server-side validation error (400 with ProblemDetails)
    ctx.error = new ALISError(
      ctx.validation.title || 'Validation failed',
      'SERVER_VALIDATION_ERROR'
    );
    emit('response:route', { id: ctx.id, status: 'validation-error' });
  } else {
    // Other HTTP errors (4xx, 5xx)
    ctx.error = new ALISError(
      `HTTP ${status}: ${ctx.response.statusText || 'Request failed'}`,
      'HTTP_ERROR'
    );
    emit('response:route', { id: ctx.id, status: 'error' });
  }

  ctx.success = false;
  return ctx;
}

