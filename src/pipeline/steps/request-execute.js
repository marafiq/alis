import { executeWithRetry } from '../../retry/executor.js';
import { getRetryPolicy } from '../../registry/retry.js';
import { ConfigError } from '../../errors/types.js';
import { startSpan, endSpan, emit } from '../../telemetry/emitter.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export async function requestExecuteStep(ctx) {
  if (ctx.error || !ctx.request) {
    if (!ctx.request && !ctx.error) {
      ctx.error = new ConfigError('Request not built');
    }
    return ctx;
  }

  const { request, config, id } = ctx;
  const span = startSpan('request', { id, url: request.url, method: request.method });

  ctx.state.startTime = ctx.state.startTime ?? Date.now();

  try {
    ctx.response = await executeFetch(request, config, ctx);
    finalizeTiming(ctx);
    endSpan(span, { status: ctx.response.status, ok: ctx.response.ok, attempts: ctx.state.attempts });
  } catch (error) {
    finalizeTiming(ctx);
    handleFetchError(error, ctx, request, span);
    throw error;
  }

  return ctx;
}

/**
 * @param {{ url: string; method: string; headers: Record<string, string>; body: any }} request
 * @param {Record<string, unknown>} config
 * @param {import('../context.js').PipelineContext} ctx
 */
async function executeFetch(request, config, ctx) {
  const options = {
    method: request.method,
    headers: request.headers,
    body: request.body,
    credentials: /** @type {RequestCredentials} */ (config.credentials ?? 'same-origin'),
    signal: ctx.abortController?.signal
  };

  const retryPolicy = resolveRetryPolicy(config.retry);

  if (retryPolicy) {
    return executeWithRetry(() => fetch(request.url, options), ctx, retryPolicy);
  }

  ctx.state.attempts = 1;
  return fetch(request.url, options);
}

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
function finalizeTiming(ctx) {
  ctx.state.endTime = Date.now();
  ctx.state.duration = ctx.state.endTime - (ctx.state.startTime ?? ctx.state.endTime);
}

/**
 * @param {unknown} error
 * @param {import('../context.js').PipelineContext} ctx
 * @param {{ url: string }} request
 * @param {import('../../telemetry/emitter.js').Span} span
 */
function handleFetchError(error, ctx, request, span) {
  const isAbort = error instanceof DOMException && error.name === 'AbortError';
  const eventName = isAbort ? 'request:abort' : 'request:error';
  const eventData = isAbort
    ? { id: ctx.id, url: request.url }
    : { id: ctx.id, url: request.url, error: error instanceof Error ? error.message : String(error) };

  emit(eventName, eventData);
  endSpan(span, { error: true, aborted: isAbort, attempts: ctx.state.attempts });
}

/**
 * @param {unknown} retryConfig
 */
function resolveRetryPolicy(retryConfig) {
  if (retryConfig === false) return null;
  if (typeof retryConfig === 'string') return getRetryPolicy(retryConfig);
  if (retryConfig && typeof retryConfig === 'object') {
    return { ...getRetryPolicy('default'), ...retryConfig };
  }
  return getRetryPolicy('default');
}
