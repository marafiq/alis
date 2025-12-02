/**
 * @param {Record<string, any> | undefined} data
 */
export function serialize(data) {
  const params = new URLSearchParams();

  if (data && typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, String(item)));
      } else {
        params.append(key, String(value));
      }
    });
  }

  return {
    body: params.toString(),
    contentType: 'application/x-www-form-urlencoded'
  };
}

