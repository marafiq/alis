/**
 * @param {Element} element
 * @param {{ indicator?: string; disabled?: boolean; debounced?: boolean }} config
 */
export function applyEffects(element, config = {}) {
  // Don't disable anything if the request is debounced - user is still interacting
  const shouldDisable = !config.debounced;
  
  if (shouldDisable) {
    if (element instanceof HTMLButtonElement || 
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement) {
      element.disabled = true;
    }
  }
  
  element.setAttribute('aria-busy', 'true');
  
  // Also set aria-busy on parent form if element is within a form
  const form = element.closest('form');
  if (form && form !== element) {
    form.setAttribute('aria-busy', 'true');
  }

  if (config.indicator) {
    const { className, selector } = parseIndicator(config.indicator);
    if (className) {
      element.classList.add(className);
    }
    if (selector) {
      const indicatorEl = document.querySelector(selector);
      if (indicatorEl) {
        indicatorEl.removeAttribute('hidden');
      }
    }
  }
}

/**
 * Parse indicator config: "class, #selector" or "class@selector" or just "class"
 * @param {string} indicator
 * @returns {{ className: string; selector: string }}
 */
export function parseIndicator(indicator) {
  if (!indicator) return { className: '', selector: '' };
  
  // Support both "class, #selector" and "class@selector" formats
  let className = '';
  let selector = '';
  
  if (indicator.includes(',')) {
    const parts = indicator.split(',').map(s => s.trim());
    className = parts[0] || '';
    selector = parts[1] || '';
  } else if (indicator.includes('@')) {
    const parts = indicator.split('@');
    className = parts[0] || '';
    selector = parts[1] || '';
  } else {
    className = indicator;
  }
  
  return { className, selector };
}

