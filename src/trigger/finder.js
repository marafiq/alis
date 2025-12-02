import { matchesTrigger } from './matcher.js';
import { getDefaultTrigger } from '../triggers/defaults.js';
import { parseTrigger } from './parser.js';

/**
 * @param {Event} event
 */
export function findTriggerElement(event) {
  let node = /** @type {Element | null} */ (event.target instanceof Element ? event.target : null);
  while (node && node !== document.body) {
    if (isAlisElement(node)) {
      if (shouldHandleEvent(node, event)) {
        return node;
      }
      break;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Check if element has any ALIS attribute (data-alis or data-alis-{method})
 * @param {Element} element
 */
function isAlisElement(element) {
  if (element.hasAttribute('data-alis')) return true;
  // Check for method-specific attributes
  return ['get', 'post', 'put', 'patch', 'delete'].some(
    method => element.hasAttribute(`data-alis-${method}`)
  );
}

/**
 * @param {Element} element
 * @param {Event} event
 */
function shouldHandleEvent(element, event) {
  if (element.hasAttribute('data-alis-trigger')) {
    return matchesTrigger(element, event);
  }
  const defaultTrigger = getDefaultTrigger(element);
  return normalizeEvent(event.type) === defaultTrigger;
}

/**
 * @param {string} type
 */
function normalizeEvent(type) {
  return type === 'keyup' ? 'change' : type;
}

/**
 * Get trigger configuration (delay, throttle) for an element
 * @param {Element} element
 * @returns {{ delay: number; throttle: number }}
 */
export function getTriggerConfig(element) {
  const triggerAttr = element.getAttribute('data-alis-trigger');
  if (!triggerAttr) {
    return { delay: 0, throttle: 0 };
  }
  
  const parsed = parseTrigger(triggerAttr);
  // Use the first trigger's config (most common case)
  const first = parsed[0] || { delay: 0, throttle: 0 };
  return {
    delay: first.delay || 0,
    throttle: first.throttle || 0
  };
}

