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
    const matchesEvent = !entry.event || entry.event === eventType;
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

