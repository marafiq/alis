const EVENT_DELIMITER = ',';

/**
 * @typedef {Object} ParsedTrigger
 * @property {string | null} selector
 * @property {string | null} event
 * @property {number} delay - Debounce delay in ms (0 = no debounce)
 * @property {number} throttle - Throttle interval in ms (0 = no throttle)
 */

/**
 * @param {string | null} value
 * @returns {ParsedTrigger[]}
 */
export function parseTrigger(value) {
  if (!value || typeof value !== 'string') {
    return [{ selector: null, event: null, delay: 0, throttle: 0 }];
  }
  return value
    .split(EVENT_DELIMITER)
    .map(part => part.trim())
    .filter(Boolean)
    .map(parseOne);
}

/**
 * Parse a single trigger entry
 * Formats:
 *   - "click" -> { event: "click" }
 *   - "input delay:500ms" -> { event: "input", delay: 500 }
 *   - "scroll throttle:200ms" -> { event: "scroll", throttle: 200 }
 *   - "#btn@click" -> { selector: "#btn", event: "click" }
 *   - "change delay:300ms throttle:100ms" -> { event: "change", delay: 300, throttle: 100 }
 * 
 * @param {string} entry
 * @returns {ParsedTrigger}
 */
export function parseOne(entry) {
  const parts = entry.split(/\s+/);
  let eventPart = parts[0];
  let selector = null;
  let event = null;
  let delay = 0;
  let throttle = 0;
  
  // Check for selector@event format
  if (eventPart.includes('@')) {
    const [sel, evt] = eventPart.split('@');
    selector = sel || null;
    event = evt || null;
  } else {
    event = eventPart;
  }
  
  // Parse modifiers (delay:Xms, throttle:Xms)
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const delayMatch = part.match(/^delay:(\d+)(ms)?$/i);
    const throttleMatch = part.match(/^throttle:(\d+)(ms)?$/i);
    
    if (delayMatch) {
      delay = parseInt(delayMatch[1], 10);
    } else if (throttleMatch) {
      throttle = parseInt(throttleMatch[1], 10);
    }
  }
  
  return { selector, event, delay, throttle };
}

/**
 * Parse time value like "500ms" or "1s" to milliseconds
 * @param {string} value
 * @returns {number}
 */
export function parseTime(value) {
  if (!value) return 0;
  const match = value.match(/^(\d+)(ms|s)?$/i);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || 'ms').toLowerCase();
  return unit === 's' ? num * 1000 : num;
}

