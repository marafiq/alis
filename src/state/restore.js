/**
 * @param {Element} element
 * @param {ReturnType<import('./capture.js').captureState>} state
 */
/**
 * @param {Element} element
 * @param {{ disabled: boolean; ariaBusy: string | null; classList: string[]; textContent: string } | null} state
 */
export function restoreState(element, state) {
  if (!state) return;

  if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
    element.disabled = state.disabled;
  }
  if (state.ariaBusy == null) {
    element.removeAttribute('aria-busy');
  } else {
    element.setAttribute('aria-busy', state.ariaBusy);
  }
  
  // Also restore aria-busy on parent form
  const form = element.closest('form');
  if (form && form !== element) {
    form.removeAttribute('aria-busy');
  }

  element.className = state.classList.join(' ');

  // Only restore textContent for button elements, NOT for selects/inputs
  // Setting textContent on a <select> would destroy all its options!
  if (element instanceof HTMLButtonElement) {
    element.textContent = state.textContent || '';
  }
}

