import { captureState } from './capture.js';
import { applyEffects } from './apply.js';
import { restoreState } from './restore.js';

/**
 * @param {Element} element
 * @param {{ indicator?: string }} config
 */
export function createStateManager(element, config = {}) {
  const captured = captureState(element);

  return {
    apply() {
      applyEffects(element, config);
    },
    restore() {
      restoreState(element, captured);
    }
  };
}

