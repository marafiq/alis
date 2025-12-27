/**
 * Serialize data as URL-encoded form data.
 *
 * @param {Record<string, unknown>} data
 * @returns {{ body: string; contentType: string }}
 */
export function serialize(data) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
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

  return {
    body: params.toString(),
    contentType: 'application/x-www-form-urlencoded'
  };
}
