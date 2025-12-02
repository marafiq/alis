import { findTriggerElement, getTriggerConfig } from './finder.js';

const LISTENERS = new Map();
/** @type {Map<Element, { timeout: number | null; lastCall: number }>} */
const DEBOUNCE_STATE = new Map();

/**
 * @param {string[]} events
 * @param {(element: Element, event: Event, triggerElement: Element | null) => void} onTrigger
 */
export function setupDelegation(events = ['click', 'submit', 'change', 'input', 'scroll'], onTrigger) {
  events.forEach(eventType => {
    if (LISTENERS.has(eventType)) return;
    const handler = /** @type {(event: Event) => void} */ (event => {
      const target = findTriggerElement(event);
      if (!target) return;
      
      // Get trigger config for debounce/throttle
      const triggerConfig = getTriggerConfig(target);
      
      // Handle debounce
      if (triggerConfig.delay > 0) {
        handleDebounce(target, triggerConfig.delay, () => {
          executeHandler(target, event, onTrigger);
        });
        if (event.cancelable) event.preventDefault();
        return;
      }
      
      // Handle throttle
      if (triggerConfig.throttle > 0) {
        if (!handleThrottle(target, triggerConfig.throttle)) {
          return; // Throttled, skip this event
        }
      }
      
      if (event.cancelable) {
        event.preventDefault();
      }
      executeHandler(target, event, onTrigger);
    });
    const useCapture = eventType === 'submit';
    document.addEventListener(eventType, handler, useCapture);
    LISTENERS.set(eventType, handler);
  });
}

/**
 * @param {Element} target
 * @param {Event} event
 * @param {(element: Element, event: Event, triggerElement: Element | null) => void} onTrigger
 */
function executeHandler(target, event, onTrigger) {
  if (typeof onTrigger === 'function') {
    const triggerElement = getTriggerElement(event);
    onTrigger(target, event, triggerElement);
  }
}

/**
 * @param {Element} element
 * @param {number} delay
 * @param {() => void} callback
 */
function handleDebounce(element, delay, callback) {
  const state = DEBOUNCE_STATE.get(element) || { timeout: null, lastCall: 0 };
  
  if (state.timeout !== null) {
    clearTimeout(state.timeout);
  }
  
  state.timeout = window.setTimeout(() => {
    state.timeout = null;
    callback();
  }, delay);
  
  DEBOUNCE_STATE.set(element, state);
}

/**
 * @param {Element} element
 * @param {number} interval
 * @returns {boolean} - true if should proceed, false if throttled
 */
function handleThrottle(element, interval) {
  const state = DEBOUNCE_STATE.get(element) || { timeout: null, lastCall: 0 };
  const now = Date.now();
  
  if (now - state.lastCall < interval) {
    return false;
  }
  
  state.lastCall = now;
  DEBOUNCE_STATE.set(element, state);
  return true;
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

