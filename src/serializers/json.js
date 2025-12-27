/**
 * Serialize data as JSON.
 *
 * @param {Record<string, unknown>} data
 * @returns {{ body: string; contentType: string }}
 */
export function serialize(data) {
  return {
    body: JSON.stringify(data),
    contentType: 'application/json'
  };
}
