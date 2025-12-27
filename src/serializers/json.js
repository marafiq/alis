import { buildNestedObject, hasNestedKeys } from '../collector/nested.js';

/**
 * Serialize data as JSON.
 * Automatically converts bracket notation field names to nested objects.
 *
 * @param {Record<string, unknown> | undefined} data
 */
export function serialize(data) {
  if (!data) {
    return {
      body: undefined,
      contentType: 'application/json'
    };
  }

  // Convert bracket notation keys to nested object structure
  const structured = hasNestedKeys(data) ? buildNestedObject(data) : data;

  return {
    body: JSON.stringify(structured),
    contentType: 'application/json'
  };
}
