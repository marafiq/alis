import { captureState } from './capture.js';
import { applyEffects, parseIndicator } from './apply.js';
import { restoreState } from './restore.js';

/**
 * @param {Element} element
 * @param {{ indicator?: string; debounced?: boolean }} config
 */
export function createStateManager(element, config = {}) {
  const captured = captureState(element);
  const { selector } = config.indicator ? parseIndicator(config.indicator) : { selector: '' };

  return {
    apply() {
      applyEffects(element, config);
    },
    restore() {
      restoreState(element, captured);
      // Re-hide indicator element if we showed it
      if (selector) {
        const indicatorEl = document.querySelector(selector);
        if (indicatorEl) {
          indicatorEl.setAttribute('hidden', '');
        }
      }
    }
  };
}

