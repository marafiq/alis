/**
 * Serialize data as FormData.
 * Handles File/Blob objects and arrays.
 *
 * @param {Record<string, unknown>} data
 * @returns {{ body: FormData; contentType: null }}
 */
export function serialize(data) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item instanceof File || item instanceof Blob) {
          formData.append(key, item);
        } else {
          formData.append(key, String(item));
        }
      }
    } else {
      formData.append(key, String(value));
    }
  }

  return {
    body: formData,
    contentType: null
  };
}
