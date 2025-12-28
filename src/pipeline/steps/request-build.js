import { getMethodAndUrl } from '../../utils/attribute-reader.js';
import { getSerializer } from '../../registry/serialize.js';
import { ConfigError } from '../../errors/types.js';

/**
 * Builds the HTTP request from context.
 * Skips if there's already an error.
 *
 * @param {import('../context.js').PipelineContext} ctx
 */
export function requestBuildStep(ctx) {
  if (ctx.error) {
    return ctx;
  }

  const methodAndUrl = ctx.config.url
    ? { method: ctx.config.method, url: ctx.config.url }
    : ctx.element
      ? getMethodAndUrl(ctx.element)
      : null;

  const method = (methodAndUrl?.method || ctx.config.method || 'GET').toUpperCase();
  const url = methodAndUrl?.url || ctx.config.url;

  if (!url) {
    ctx.error = new ConfigError('URL is required');
    return ctx;
  }

  /** @type {Record<string, string>} */
  const headers = { ...(ctx.config.headers || {}) };
  let body;
  let finalUrl = url;

  const data = ctx.collect?.data;
  if (data && typeof data === 'object') {
    const payload = /** @type {Record<string, unknown>} */ (data);

    if (method === 'GET') {
      const query = buildQueryString(payload);
      if (query) {
        finalUrl = url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
      }
    } else {
      const isFormElement = ctx.element instanceof HTMLFormElement;
      const serializerName = ctx.config.serialize || (isFormElement ? 'formdata' : 'json');
      const serializer = getSerializer(serializerName);
      const serialized = serializer(payload);
      body = serialized.body;
      if (serialized.contentType && !headers['Content-Type']) {
        headers['Content-Type'] = serialized.contentType;
      }
    }
  }

  ctx.request = { url: finalUrl, method, headers, body };
  return ctx;
}

/**
 * @param {Record<string, unknown>} data
 */
function buildQueryString(data) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
    } else {
      params.append(key, String(value));
    }
  }

  return params.toString();
}
