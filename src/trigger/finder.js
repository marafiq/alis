import { matchesTrigger } from './matcher.js';
import { getDefaultTrigger } from '../triggers/defaults.js';
import { parseTrigger } from './parser.js';
import { FORCE_TRIGGER_EVENT } from './constants.js';

/**
 * Syncfusion control class patterns - visible input elements created by Syncfusion
 */
const SYNCFUSION_INPUT_CLASSES = ['e-input', 'e-dropdownlist', 'e-numerictextbox', 'e-datepicker'];

/**
 * Syncfusion wrapper class patterns - these wrap actual input elements
 */
const SYNCFUSION_WRAPPER_CLASSES = [
  'e-input-group',
  'e-control-wrapper', 
  'e-ddl',
  'e-numerictextbox',
  'e-datepicker',
  'e-checkbox-wrapper'
];

/**
 * Check if element is a Syncfusion wrapper that contains the event target
 * @param {Element} element
 * @returns {boolean}
 */
function isSyncfusionWrapper(element) {
  return SYNCFUSION_WRAPPER_CLASSES.some(cls => element.classList.contains(cls));
}

/**
 * Check if element is a Syncfusion-created input (the visible one, not the original)
 * @param {Element} element
 * @returns {boolean}
 */
function isSyncfusionInput(element) {
  return SYNCFUSION_INPUT_CLASSES.some(cls => element.classList.contains(cls));
}

/**
 * Find the original ALIS element for a Syncfusion control.
 * Syncfusion's appendTo() transforms the original element, but the original
 * element (with ALIS attributes) can be found via the wrapper's ID or
 * by looking for elements with ej2_instances.
 * @param {Element} target - The event target (Syncfusion's visible input)
 * @returns {Element | null}
 */
function findSyncfusionAlisElement(target) {
  // Look for the closest Syncfusion wrapper
  const wrapper = target.closest('.e-input-group, .e-control-wrapper, .e-ddl');
  if (!wrapper) return null;
  
  // The wrapper might have an ID that matches the original element
  // Or there might be a hidden input with the ID and ALIS attributes
  const wrapperId = wrapper.id;
  if (wrapperId) {
    const original = document.getElementById(wrapperId);
    if (original && isAlisElement(original)) {
      return original;
    }
  }
  
  // Look for any element with ej2_instances inside the wrapper that has ALIS attrs
  const elementsWithInstances = wrapper.querySelectorAll('[id]');
  for (const el of elementsWithInstances) {
    if (/** @type {any} */ (el).ej2_instances && isAlisElement(el)) {
      return el;
    }
  }
  
  // Check if the wrapper itself has ALIS attributes
  if (isAlisElement(wrapper)) {
    return wrapper;
  }
  
  return null;
}

/**
 * @param {Event} event
 */
export function findTriggerElement(event) {
  let node = /** @type {Element | null} */ (event.target instanceof Element ? event.target : null);
  
  // Debug logging for Syncfusion integration troubleshooting
  const DEBUG = typeof window !== 'undefined' && window.ALIS_DEBUG;
  if (DEBUG && (event.type === 'input' || event.type === 'change')) {
    console.log('[ALIS DEBUG] findTriggerElement - eventType:', event.type,
      'target:', node?.tagName,
      'targetId:', node?.id,
      'targetClass:', node?.className,
      'hasAlisGet:', node?.hasAttribute('data-alis-get'),
      'hasAlisTrigger:', node?.hasAttribute('data-alis-trigger'));
  }
  
  // Special handling for Syncfusion controls:
  // When user types in a Syncfusion TextBox, the event fires on the visible e-input,
  // but ALIS attributes are on the original hidden input that Syncfusion transformed.
  if (node && isSyncfusionInput(node) && !isAlisElement(node)) {
    const alisElement = findSyncfusionAlisElement(node);
    if (DEBUG && (event.type === 'input' || event.type === 'change')) {
      console.log('[ALIS DEBUG] Syncfusion input detected, found ALIS element:', 
        alisElement?.tagName, alisElement?.id);
    }
    if (alisElement && shouldHandleEvent(alisElement, event)) {
      return alisElement;
    }
  }
  
  while (node && node !== document.body) {
    if (isAlisElement(node)) {
      if (DEBUG && (event.type === 'input' || event.type === 'change')) {
        console.log('[ALIS DEBUG] Found ALIS element - tagName:', node.tagName,
          'id:', node.id,
          'trigger:', node.getAttribute('data-alis-trigger'));
      }
      // For Syncfusion wrappers, check if there's an explicit trigger attribute
      // that matches the event, even if the default trigger wouldn't match
      if (shouldHandleEvent(node, event)) {
        if (DEBUG && (event.type === 'input' || event.type === 'change')) {
          console.log('[ALIS DEBUG] shouldHandleEvent returned true');
        }
        return node;
      }
      if (DEBUG && (event.type === 'input' || event.type === 'change')) {
        console.log('[ALIS DEBUG] shouldHandleEvent returned false, continuing...');
      }
      // Don't break early - continue looking up the tree for other ALIS elements
      // This handles cases where a form contains ALIS-enabled inputs
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
  // Force trigger event always matches - this is used for Syncfusion integration
  // where Syncfusion's change handler calls ALIS.forceTrigger(element)
  if (event.type === FORCE_TRIGGER_EVENT) {
    return true;
  }
  
  // If element has explicit trigger, use that
  if (element.hasAttribute('data-alis-trigger')) {
    return matchesTrigger(element, event);
  }
  
  // For Syncfusion wrappers, also accept input/change events from inner elements
  // since the wrapper contains the actual input but ALIS attrs are on the wrapper
  if (isSyncfusionWrapper(element)) {
    const eventType = normalizeEvent(event.type);
    // Accept input, change, blur events for Syncfusion wrappers
    if (['input', 'change', 'blur', 'focus'].includes(eventType)) {
      return true;
    }
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

