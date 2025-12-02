/**
 * @param {Element} element
 * @param {{ indicator?: string; disabled?: boolean }} config
 */
export function applyEffects(element, config = {}) {
  if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
    element.disabled = true;
  }
  element.setAttribute('aria-busy', 'true');

  if (config.indicator) {
    const className = parseIndicator(config.indicator);
    if (className) {
      element.classList.add(className);
    }
  }
}

/**
 * @param {string} indicator
 */
function parseIndicator(indicator) {
  if (!indicator) return '';
  if (indicator.includes('@')) {
    return indicator.split('@')[0];
  }
  return indicator;
}

