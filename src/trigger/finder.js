import { matchesTrigger } from './matcher.js';
import { getDefaultTrigger } from '../triggers/defaults.js';

/**
 * @param {Event} event
 */
export function findTriggerElement(event) {
  let node = /** @type {Element | null} */ (event.target instanceof Element ? event.target : null);
  while (node && node !== document.body) {
    if (node.hasAttribute('data-alis')) {
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

