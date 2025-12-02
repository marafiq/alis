/**
 * @param {Element} element
 */
export function getDefaultTrigger(element) {
  if (element instanceof HTMLFormElement) {
    return 'submit';
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
    return 'change';
  }
  return 'click';
}

