import { findTriggerElement } from './finder.js';

const LISTENERS = new Map();

/**
 * @param {string[]} events
 */
export function setupDelegation(events = ['click', 'submit', 'change']) {
  events.forEach(eventType => {
    if (LISTENERS.has(eventType)) return;
    const handler = /** @type {(event: Event) => void} */ (event => {
      const target = findTriggerElement(event);
      if (target) {
        target.dispatchEvent(new CustomEvent('alis:trigger', { detail: event, bubbles: true }));
      }
    });
    document.addEventListener(eventType, handler);
    LISTENERS.set(eventType, handler);
  });
}

export function teardownDelegation() {
  LISTENERS.forEach((handler, eventType) => {
    document.removeEventListener(eventType, handler);
  });
  LISTENERS.clear();
}

