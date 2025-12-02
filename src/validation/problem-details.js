/**
 * @param {unknown} value
 * @returns {value is { title?: string; detail?: string; errors?: Record<string, string[] | string> }}
 */
export function isProblemDetails(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    ('title' in value || 'detail' in value || 'errors' in value)
  );
}

/**
 * @param {unknown} payload
 */
export function parseProblemDetails(payload) {
  if (!isProblemDetails(payload)) {
    return null;
  }

  /** @type {Record<string, string[]>} */
  const errors = {};
  if (payload.errors && typeof payload.errors === 'object') {
    Object.entries(payload.errors).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        errors[key] = value.map(String);
      } else if (value != null) {
        errors[key] = [String(value)];
      }
    });
  }

  return {
    title: payload.title || 'Validation error',
    detail: payload.detail || '',
    errors
  };
}

