const DISABLEABLE_TAGS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);

/**
 * @param {Element | null} element
 * @returns {element is HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement}
 */
export function canBeDisabled(element) {
  return !!element && DISABLEABLE_TAGS.has(element.tagName);
}

/**
 * @param {string | Element} target
 * @param {Document | Element} root
 */
export function resolveElement(target, root = document) {
  if (!target) {
    throw new Error('resolveElement: target is required');
  }
  if (target instanceof Element) {
    return target;
  }
  if (typeof target === 'string') {
    const resolved = root.querySelector(target);
    if (!resolved) {
      throw new Error(`Element not found for selector "${target}"`);
    }
    return resolved;
  }
  throw new TypeError('resolveElement: unsupported target type');
}

