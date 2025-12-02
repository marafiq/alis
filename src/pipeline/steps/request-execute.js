import { executeWithRetry } from '../../retry/executor.js';
import { getRetryPolicy } from '../../registry/retry.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export async function requestExecuteStep(ctx) {
  if (!ctx.request) {
    throw new Error('requestExecuteStep: request not built');
  }

  const request = ctx.request;
  const fetchOptions = {
    method: request.method,
    headers: request.headers,
    body: request.body,
    credentials: /** @type {RequestCredentials} */ (ctx.config.credentials ?? 'same-origin')
  };

  const requestFn = () => fetch(request.url, fetchOptions);
  ctx.state.startTime = ctx.state.startTime ?? Date.now();

  const retryPolicy = resolveRetryPolicy(ctx.config.retry);
  let response;

  if (retryPolicy) {
    response = await executeWithRetry(requestFn, ctx, retryPolicy);
  } else {
    ctx.state.attempts = 1;
    response = await requestFn();
  }

  ctx.response = response;
  ctx.state.endTime = Date.now();
  ctx.state.duration = ctx.state.endTime - (ctx.state.startTime || ctx.state.endTime);

  return ctx;
}

/**
 * @param {unknown} retryConfig
 */
function resolveRetryPolicy(retryConfig) {
  if (retryConfig === false) {
    return null;
  }
  if (typeof retryConfig === 'string') {
    return getRetryPolicy(retryConfig);
  }
  if (retryConfig && typeof retryConfig === 'object') {
    return {
      ...getRetryPolicy('default'),
      ...retryConfig
    };
  }
  return getRetryPolicy('default');
}

