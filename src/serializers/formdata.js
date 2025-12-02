/**
 * @param {Record<string, any> | undefined} data
 */
export function serialize(data) {
  const formData = new FormData();

  if (data && typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, item));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
  }

  return {
    body: formData,
    contentType: null
  };
}

