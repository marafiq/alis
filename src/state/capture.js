/**
 * @param {Element} element
 */
/**
 * @param {Element} element
 */
export function captureState(element) {
  const state = {
    disabled: element instanceof HTMLButtonElement || element instanceof HTMLInputElement
      ? element.disabled
      : false,
    ariaBusy: element.getAttribute('aria-busy'),
    classList: Array.from(element.classList),
    textContent: element instanceof HTMLElement ? element.textContent ?? '' : ''
  };

  return state;
}

