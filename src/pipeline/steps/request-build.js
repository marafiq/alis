import { getMethodAndUrl } from '../../utils/attribute-reader.js';
import { getSerializer } from '../../registry/serialize.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function requestBuildStep(ctx) {
  // Skip if there's already an error (e.g., from validation)
  if (ctx.error) {
    return ctx;
  }
  
  const methodAndUrl = ctx.config.url
    ? { method: ctx.config.method, url: ctx.config.url }
    : ctx.element
    ? getMethodAndUrl(ctx.element)
    : null;

  const resolvedMethod = toMethod(methodAndUrl?.method) || toMethod(ctx.config.method) || 'GET';
  const method = resolvedMethod.toUpperCase();
  const url = typeof methodAndUrl?.url === 'string' ? methodAndUrl.url : typeof ctx.config.url === 'string' ? ctx.config.url : undefined;

  if (!url) {
    throw new Error('requestBuildStep: URL is required');
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
        finalUrl = appendQuery(finalUrl, query);
      }
    } else {
      // Form elements default to FormData (matches jQuery Unobtrusive, works with ASP.NET model binding)
      // Non-form elements default to JSON (API-style requests)
      const isFormElement = ctx.element instanceof HTMLFormElement;
      const defaultSerializer = isFormElement ? 'formdata' : 'json';
      const serializerName = typeof ctx.config.serialize === 'string' ? ctx.config.serialize : defaultSerializer;
      const serializer = getSerializer(serializerName);
      const serialized = serializer(payload);
      body = serialized.body;
      if (serialized.contentType && !headers['Content-Type']) {
        headers['Content-Type'] = serialized.contentType;
      }
    }
  }

  ctx.request = {
    url: finalUrl,
    method,
    headers,
    body
  };

  return ctx;
}

/**
 * @param {Record<string, unknown>} data
 */
function buildQueryString(data) {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value == null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(item => params.append(key, String(item)));
    } else if (isLegacyField(value)) {
      params.append(value.name, String(value.value));
    } else {
      params.append(key, String(value));
    }
  });
  return params.toString();
}

/**
 * @param {string} url
 * @param {string} query
 */
function appendQuery(url, query) {
  if (!query) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${query}`;
}

/**
 * @param {unknown} value
 */
function toMethod(value) {
  return typeof value === 'string' ? value : undefined;
}

/**
 * @param {unknown} value
 * @returns {value is { name: string; value: unknown }}
 */
function isLegacyField(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'name' in value &&
    'value' in value
  );
}

