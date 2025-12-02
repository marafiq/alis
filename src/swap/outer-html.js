/**
 * @param {Element} target
 * @param {string} content
 */
export function swap(target, content) {
  const doc = target.ownerDocument;
  const template = doc.createElement('template');
  template.innerHTML = content.trim();

  const replacement = template.content.firstElementChild;
  if (!replacement) {
    target.outerHTML = content;
    return target.nextElementSibling || target;
  }

  const node = replacement.cloneNode(true);
  target.replaceWith(node);
  return /** @type {Element} */ (node);
}

