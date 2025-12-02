const EVENT_DELIMITER = ',';

/**
 * @param {string | null} value
 */
export function parseTrigger(value) {
  if (!value || typeof value !== 'string') {
    return [{ selector: null, event: null }];
  }
  return value
    .split(EVENT_DELIMITER)
    .map(part => part.trim())
    .filter(Boolean)
    .map(parseOne);
}

/**
 * @param {string} entry
 */
export function parseOne(entry) {
  if (!entry.includes('@')) {
    return { selector: null, event: entry };
  }
  const [selector, event] = entry.split('@');
  return {
    selector: selector || null,
    event: event || null
  };
}

