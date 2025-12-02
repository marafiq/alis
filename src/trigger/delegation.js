import { findTriggerElement } from './finder.js';

const LISTENERS = new Map();

/**
 * @param {string[]} events
 * @param {(element: Element, event: Event, triggerElement: Element | null) => void} onTrigger
 */
export function setupDelegation(events = ['click', 'submit', 'change'], onTrigger) {
  events.forEach(eventType => {
    if (LISTENERS.has(eventType)) return;
    const handler = /** @type {(event: Event) => void} */ (event => {
      const target = findTriggerElement(event);
      if (!target) return;
      if (event.cancelable) {
        event.preventDefault();
      }
      if (typeof onTrigger === 'function') {
        const triggerElement = getTriggerElement(event);
        onTrigger(target, event, triggerElement);
      }
    });
    const useCapture = eventType === 'submit';
    document.addEventListener(eventType, handler, useCapture);
    LISTENERS.set(eventType, handler);
  });
}

export function teardownDelegation() {
  LISTENERS.forEach((handler, eventType) => {
    const useCapture = eventType === 'submit';
    document.removeEventListener(eventType, handler, useCapture);
  });
  LISTENERS.clear();
}

/**
 * @param {Event} event
 */
function getTriggerElement(event) {
  if (typeof SubmitEvent !== 'undefined' && event instanceof SubmitEvent && event.submitter) {
    return event.submitter;
  }
  return event.target instanceof Element ? event.target : null;
}

