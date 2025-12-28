import { getSwapStrategy } from '../../registry/swap.js';
import { emit } from '../../telemetry/emitter.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function swapStep(ctx) {
  if (ctx.error || !ctx.config.target || ctx.body == null) {
    return ctx;
  }

  const target = resolveTarget(ctx.config.target);
  if (!target) {
    emit('swap:target-missing', { id: ctx.id, selector: ctx.config.target });
    return ctx;
  }

  const focusState = captureFocus(target);
  performSwap(target, ctx.body, ctx.config.swap);
  restoreFocus(focusState);

  return ctx;
}

/**
 * @param {string} selector
 */
function resolveTarget(selector) {
  const normalized = selector.startsWith('#') ? selector : `#${selector}`;
  return document.querySelector(normalized);
}

/**
 * @param {Element} target
 * @param {unknown} content
 * @param {unknown} swapMode
 */
function performSwap(target, content, swapMode) {
  const strategyName = typeof swapMode === 'string' ? swapMode : 'innerHTML';
  const strategy = getSwapStrategy(strategyName);
  const html = typeof content === 'string' ? content : JSON.stringify(content);
  strategy(target, html);
}

/**
 * Capture focus state for elements outside the swap target.
 * @param {Element} target
 */
function captureFocus(target) {
  const active = document.activeElement;
  const shouldPreserve = active && active !== document.body && !target.contains(active);

  if (!shouldPreserve) return null;

  /** @type {{ element: HTMLElement; selectionStart?: number | null; selectionEnd?: number | null } | null} */
  const state = { element: /** @type {HTMLElement} */ (active) };

  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
    try {
      state.selectionStart = active.selectionStart;
      state.selectionEnd = active.selectionEnd;
    } catch {
      // Some input types don't support selection
    }
  }

  return state;
}

/**
 * Restore focus and cursor position after swap.
 * @param {{ element: HTMLElement; selectionStart?: number | null; selectionEnd?: number | null } | null} state
 */
function restoreFocus(state) {
  if (!state || !document.body.contains(state.element)) return;

  state.element.focus();

  const { selectionStart, selectionEnd } = state;
  if (selectionStart != null && selectionEnd != null) {
    const el = state.element;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      try {
        el.setSelectionRange(selectionStart, selectionEnd);
      } catch {
        // Some input types don't support setSelectionRange
      }
    }
  }
}
