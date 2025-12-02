import { METHODS } from '../config/defaults.js';

/**
 * @param {Element} element
 * @returns {{ method: string; url: string }}
 */
export function getMethodAndUrl(element) {
  if (!element) {
    throw new TypeError('getMethodAndUrl: element is required');
  }

  if (element instanceof HTMLFormElement) {
    const method = (element.getAttribute('method') || 'get').toLowerCase();
    const action = element.getAttribute('action');
    if (!action) {
      throw new Error('Form requires an action attribute for ALIS');
    }
    return { method, url: action };
  }

  for (const method of METHODS) {
    const attr = element.getAttribute(`data-alis-${method}`);
    if (attr) {
      return { method, url: attr };
    }
  }

  throw new Error('No ALIS method attribute found');
}

/**
 * @param {Element} element
 * @param {string} name
 * @returns {string | undefined}
 */
export function getAttribute(element, name) {
  if (!element || typeof name !== 'string') {
    return undefined;
  }
  const dataName = `data-alis-${name}`;
  return element.getAttribute(dataName) ?? undefined;
}

/**
 * @param {string | null | undefined} selector
 */
export function normalizeSelector(selector) {
  if (selector == null) {
    return '';
  }
  const value = String(selector).trim();
  if (!value) {
    return '';
  }
  if (value.startsWith('#') || value.startsWith('.') || value.startsWith('[')) {
    return value;
  }
  return `#${value}`;
}

/**
 * @param {Element} element
 * @returns {Record<string, string>}
 */
export function getAllAttributes(element) {
  if (!element) {
    return {};
  }
  /** @type {Record<string, string>} */
  const collected = {};
  Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-alis-'))
    .forEach(attr => {
      const key = attr.name.replace('data-alis-', '');
      collected[key] = attr.value;
    });
  return collected;
}

