/**
 * @param {Element} element
 */
export function captureState(element) {
  // Capture disabled state for all elements that can be disabled
  const canBeDisabled = element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement;

  // Also capture parent form's aria-busy state
  const form = element.closest('form');
  const formAriaBusy = (form && form !== element) ? form.getAttribute('aria-busy') : null;

  const state = {
    disabled: canBeDisabled ? element.disabled : false,
    ariaBusy: element.getAttribute('aria-busy'),
    formAriaBusy,
    classList: Array.from(element.classList),
    textContent: element instanceof HTMLElement ? element.textContent ?? '' : ''
  };

  return state;
}

