/**
 * Serialize data as FormData.
 * Handles File/Blob objects, arrays, and nested objects.
 * Nested objects use dot notation for ASP.NET Core model binding.
 *
 * @param {Record<string, unknown>} data
 * @returns {{ body: FormData; contentType: null }}
 */
export function serialize(data) {
  const formData = new FormData();
  appendToFormData(formData, '', data);
  return {
    body: formData,
    contentType: null
  };
}

/**
 * Recursively append values to FormData with proper key paths.
 * - Simple arrays use repeated keys: items=a&items=b
 * - Object arrays use indexed keys: items[0].name=John
 * - Nested objects use dot notation: user.name=John
 *
 * @param {FormData} formData
 * @param {string} prefix
 * @param {unknown} value
 */
function appendToFormData(formData, prefix, value) {
  if (value === undefined || value === null) {
    return;
  }

  if (value instanceof File || value instanceof Blob) {
    formData.append(prefix, value);
  } else if (value instanceof Date) {
    formData.append(prefix, value.toISOString());
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (item instanceof File || item instanceof Blob) {
        formData.append(prefix, item);
      } else if (typeof item === 'object' && item !== null && !(item instanceof Date)) {
        // Object in array - use indexed notation
        const key = prefix ? `${prefix}[${i}]` : `[${i}]`;
        appendToFormData(formData, key, item);
      } else {
        // Primitive in array - use repeated key (standard form behavior)
        formData.append(prefix, item instanceof Date ? item.toISOString() : String(item));
      }
    }
  } else if (typeof value === 'object') {
    for (const [key, val] of Object.entries(value)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      appendToFormData(formData, fullKey, val);
    }
  } else {
    formData.append(prefix, String(value));
  }
}
