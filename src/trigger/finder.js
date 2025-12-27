import { matchesTrigger } from './matcher.js';
import { getDefaultTrigger } from '../triggers/defaults.js';
import { parseTrigger } from './parser.js';
import { FORCE_TRIGGER_EVENT } from './constants.js';
import { hasSyncfusionInstance, isSyncfusionInput } from '../syncfusion/constants.js';

/**
 * Find the ALIS element for a Syncfusion control.
 * @param {Element} target
 * @returns {Element | null}
 */
function findSyncfusionAlisElement(target) {
  let current = target.parentElement;
  while (current && current !== document.body) {
    if (hasSyncfusionInstance(current) && isAlisElement(current)) {
      return current;
    }
    for (const el of current.querySelectorAll('[id]')) {
      if (hasSyncfusionInstance(el) && isAlisElement(el)) {
        return el;
      }
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * @param {Event} event
 */
export function findTriggerElement(event) {
  let node = /** @type {Element | null} */ (event.target instanceof Element ? event.target : null);

  // Syncfusion: event fires on visible input, ALIS attrs are on transformed element
  if (node && isSyncfusionInput(node) && !isAlisElement(node)) {
    const alisElement = findSyncfusionAlisElement(node);
    if (alisElement && shouldHandleEvent(alisElement, event)) {
      return alisElement;
    }
  }

  while (node && node !== document.body) {
    if (isAlisElement(node) && shouldHandleEvent(node, event)) {
      return node;
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
  if (event.type === FORCE_TRIGGER_EVENT) {
    return true;
  }

  if (element.hasAttribute('data-alis-trigger')) {
    return matchesTrigger(element, event);
  }

  if (hasSyncfusionInstance(element)) {
    const mapped = mapToDefaultTrigger(event.type);
    if (['input', 'change', 'blur', 'focus'].includes(mapped)) {
      return true;
    }
  }

  return mapToDefaultTrigger(event.type) === getDefaultTrigger(element);
}

/**
 * Map event types to their default trigger equivalents.
 * For example, keyup is treated as change for input fields.
 * @param {string} type
 */
function mapToDefaultTrigger(type) {
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

