/**
 * Serialize data as URL-encoded form data.
 * Handles arrays and nested objects with dot notation for ASP.NET Core.
 *
 * @param {Record<string, unknown>} data
 * @returns {{ body: string; contentType: string }}
 */
export function serialize(data) {
  const params = new URLSearchParams();
  appendToParams(params, '', data);
  return {
    body: params.toString(),
    contentType: 'application/x-www-form-urlencoded'
  };
}

/**
 * Recursively append values to URLSearchParams with proper key paths.
 * - Simple arrays use repeated keys: items=a&items=b
 * - Object arrays use indexed keys: items[0].name=John
 * - Nested objects use dot notation: user.name=John
 *
 * @param {URLSearchParams} params
 * @param {string} prefix
 * @param {unknown} value
 */
function appendToParams(params, prefix, value) {
  if (value === undefined || value === null) {
    return;
  }

  if (value instanceof Date) {
    params.append(prefix, value.toISOString());
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (typeof item === 'object' && item !== null && !(item instanceof Date)) {
        // Object in array - use indexed notation
        const key = prefix ? `${prefix}[${i}]` : `[${i}]`;
        appendToParams(params, key, item);
      } else {
        // Primitive in array - use repeated key (standard form behavior)
        params.append(prefix, item instanceof Date ? item.toISOString() : String(item));
      }
    }
  } else if (typeof value === 'object') {
    for (const [key, val] of Object.entries(value)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      appendToParams(params, fullKey, val);
    }
  } else {
    params.append(prefix, String(value));
  }
}
