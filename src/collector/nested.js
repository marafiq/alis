/**
 * Nested Object Builder
 *
 * Converts flat form field names with bracket notation into nested object structures.
 * Supports both array indices and nested property access.
 *
 * Examples:
 *   "items[0].Name" → { items: [{ Name: value }] }
 *   "person.address.city" → { person: { address: { city: value } } }
 *   "tags[]" → { tags: [value] }
 */

/**
 * Parse a field name into path segments.
 * Handles bracket notation for arrays and dot notation for objects.
 *
 * @param {string} name - Field name like "items[0].Name" or "person.address.city"
 * @returns {Array<string | number>} - Path segments like ["items", 0, "Name"]
 */
export function parseFieldName(name) {
  /** @type {Array<string | number>} */
  const segments = [];
  let current = '';
  let i = 0;

  while (i < name.length) {
    const char = name[i];

    if (char === '[') {
      // Push current segment if not empty
      if (current) {
        segments.push(current);
        current = '';
      }

      // Find closing bracket
      const end = name.indexOf(']', i);
      if (end === -1) {
        // Malformed, treat rest as literal
        current = name.substring(i);
        break;
      }

      const content = name.substring(i + 1, end);
      if (content === '') {
        // Empty brackets like "tags[]" - indicates array append
        segments.push(-1); // -1 signals array append
      } else {
        const num = parseInt(content, 10);
        if (!isNaN(num) && num.toString() === content) {
          segments.push(num);
        } else {
          // Non-numeric bracket content treated as property name
          segments.push(content);
        }
      }

      i = end + 1;
      // Skip following dot if present
      if (name[i] === '.') {
        i++;
      }
    } else if (char === '.') {
      if (current) {
        segments.push(current);
        current = '';
      }
      i++;
    } else {
      current += char;
      i++;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

/**
 * Set a value at a nested path in an object.
 * Creates intermediate objects/arrays as needed.
 *
 * @param {Record<string, any>} root - Root object to modify
 * @param {Array<string | number>} path - Path segments
 * @param {unknown} value - Value to set
 */
export function setNestedValue(root, path, value) {
  if (path.length === 0) return;

  let current = root;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    const nextSegment = path[i + 1];
    const needsArray = typeof nextSegment === 'number';

    if (typeof segment === 'number') {
      // Array index
      if (segment === -1) {
        // Array append - find next available index
        const index = Array.isArray(current) ? current.length : 0;
        if (!Array.isArray(current)) {
          throw new Error('Cannot append to non-array');
        }
        current[index] = needsArray ? [] : {};
        current = current[index];
      } else {
        // Ensure array exists and has capacity
        if (!current[segment]) {
          current[segment] = needsArray ? [] : {};
        }
        current = current[segment];
      }
    } else {
      // Object property
      if (current[segment] === undefined) {
        current[segment] = needsArray ? [] : {};
      }
      current = current[segment];
    }
  }

  // Set the final value
  const lastSegment = path[path.length - 1];

  if (typeof lastSegment === 'number') {
    if (lastSegment === -1) {
      // Array append
      if (Array.isArray(current)) {
        // If value is array, append each element
        if (Array.isArray(value)) {
          current.push(...value);
        } else {
          current.push(value);
        }
      }
    } else {
      current[lastSegment] = value;
    }
  } else {
    // Handle accumulation: if path already has a value, make it an array
    if (current[lastSegment] !== undefined) {
      const existing = current[lastSegment];
      if (Array.isArray(existing)) {
        if (Array.isArray(value)) {
          existing.push(...value);
        } else {
          existing.push(value);
        }
      } else {
        if (Array.isArray(value)) {
          current[lastSegment] = [existing, ...value];
        } else {
          current[lastSegment] = [existing, value];
        }
      }
    } else {
      current[lastSegment] = value;
    }
  }
}

/**
 * Convert flat field data with bracket notation into nested object structure.
 *
 * @param {Record<string, unknown>} data - Flat data with bracket notation keys
 * @returns {Record<string, unknown>} - Nested object structure
 *
 * @example
 * buildNestedObject({
 *   'items[0].Name': 'Item 1',
 *   'items[0].Value': 100,
 *   'items[1].Name': 'Item 2',
 *   'items[1].Value': 200
 * })
 * // Returns:
 * // {
 * //   items: [
 * //     { Name: 'Item 1', Value: 100 },
 * //     { Name: 'Item 2', Value: 200 }
 * //   ]
 * // }
 */
export function buildNestedObject(data) {
  /** @type {Record<string, any>} */
  const result = {};

  for (const [key, value] of Object.entries(data)) {
    const path = parseFieldName(key);
    if (path.length === 0) continue;

    setNestedValue(result, path, value);
  }

  return result;
}

/**
 * Check if data contains any bracket notation keys that need nesting.
 *
 * @param {Record<string, unknown>} data
 * @returns {boolean}
 */
export function hasNestedKeys(data) {
  return Object.keys(data).some(key => key.includes('[') || key.includes('.'));
}
