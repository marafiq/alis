/**
 * @param {Record<string, unknown> | undefined} data
 */
export function serialize(data) {
  return {
    body: data ? JSON.stringify(data) : undefined,
    contentType: 'application/json'
  };
}

