/**
 * @param {Element | null} element
 */
export function isInteractiveElement(element) {
  if (!element) return false;
  const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
  return interactiveTags.includes(element.tagName);
}

/**
 * @param {Element | null} element
 */
export function isFormField(element) {
  if (!element) return false;
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
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

