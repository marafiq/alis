import { canBeDisabled } from '../utils/element-utils.js';

/**
 * @param {Element} element
 */
export function captureState(element) {
  const form = element.closest('form');

  return {
    disabled: canBeDisabled(element) ? element.disabled : false,
    ariaBusy: element.getAttribute('aria-busy'),
    formAriaBusy: (form && form !== element) ? form.getAttribute('aria-busy') : null,
    classList: Array.from(element.classList),
    textContent: element instanceof HTMLElement ? element.textContent ?? '' : ''
  };
}

