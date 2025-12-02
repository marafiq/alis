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

  element.className = state.classList.join(' ');

  if (element instanceof HTMLElement) {
    element.textContent = state.textContent || '';
  }
}

