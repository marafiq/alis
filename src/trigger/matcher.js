import { parseTrigger } from './parser.js';

/**
 * @param {Element} element
 * @param {Event} event
 */
export function matchesTrigger(element, event) {
  const triggerAttr = element.getAttribute('data-alis-trigger');
  const entries = parseTrigger(triggerAttr);
  const eventType = normalizeEventType(event.type, event);

  return entries.some(entry => {
    // Extract just the event name (without modifiers like delay:500ms)
    const entryEvent = entry.event ? entry.event.split(/\s+/)[0] : null;
    const matchesEvent = !entryEvent || entryEvent === eventType;
    const matchesSelector =
      !entry.selector ||
      (event.target instanceof Element && event.target.matches(entry.selector));
    return matchesEvent && matchesSelector;
  });
}

/**
 * @param {string} type
 * @param {Event} event
 */
export function normalizeEventType(type, event) {
  if (type === 'keyup' && 'key' in event && event.key === 'Enter') {
    return 'keyenter';
  }
  return type;
}

