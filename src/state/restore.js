import { canBeDisabled } from '../utils/element-utils.js';

/**
 * @param {Element} element
 * @param {{ disabled: boolean; ariaBusy: string | null; formAriaBusy?: string | null; classList: string[]; textContent: string } | null} state
 */
export function restoreState(element, state) {
  if (!state) return;

  if (canBeDisabled(element)) {
    element.disabled = state.disabled;
  }

  if (state.ariaBusy == null) {
    element.removeAttribute('aria-busy');
  } else {
    element.setAttribute('aria-busy', state.ariaBusy);
  }

  const form = element.closest('form');
  if (form && form !== element) {
    if (state.formAriaBusy == null) {
      form.removeAttribute('aria-busy');
    } else {
      form.setAttribute('aria-busy', state.formAriaBusy);
    }
  }

  element.className = state.classList.join(' ');

  if (element instanceof HTMLButtonElement) {
    element.textContent = state.textContent || '';
  }
}

