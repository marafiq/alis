/**
 * @param {Element} element
 * @param {{ disabled: boolean; ariaBusy: string | null; formAriaBusy?: string | null; classList: string[]; textContent: string } | null} state
 */
export function restoreState(element, state) {
  if (!state) return;

  // Restore disabled state for all elements that can be disabled
  if (element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement) {
    element.disabled = state.disabled;
  }

  if (state.ariaBusy == null) {
    element.removeAttribute('aria-busy');
  } else {
    element.setAttribute('aria-busy', state.ariaBusy);
  }

  // Also restore aria-busy on parent form to its original state
  const form = element.closest('form');
  if (form && form !== element) {
    if (state.formAriaBusy == null) {
      form.removeAttribute('aria-busy');
    } else {
      form.setAttribute('aria-busy', state.formAriaBusy);
    }
  }

  element.className = state.classList.join(' ');

  // Only restore textContent for button elements, NOT for selects/inputs
  // Setting textContent on a <select> would destroy all its options!
  if (element instanceof HTMLButtonElement) {
    element.textContent = state.textContent || '';
  }
}

