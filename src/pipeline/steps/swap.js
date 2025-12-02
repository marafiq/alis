import { getSwapStrategy } from '../../registry/swap.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function swapStep(ctx) {
  if (typeof ctx.config.target !== 'string' || ctx.body == null) {
    return ctx;
  }

  const selector = ctx.config.target.startsWith('#') ? ctx.config.target : `#${ctx.config.target}`;
  const target = document.querySelector(selector);
  if (!target) {
    return ctx;
  }

  // Capture focus state BEFORE swap
  const activeElement = document.activeElement;
  const shouldRestoreFocus = activeElement && 
    activeElement !== document.body && 
    !target.contains(activeElement);
  
  // Get cursor position for text inputs
  let selectionStart = null;
  let selectionEnd = null;
  if (shouldRestoreFocus && (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
    try {
      selectionStart = activeElement.selectionStart;
      selectionEnd = activeElement.selectionEnd;
    } catch {
      // Some input types don't support selection
    }
  }

  const strategyName = typeof ctx.config.swap === 'string' ? ctx.config.swap : 'innerHTML';
  const strategy = getSwapStrategy(strategyName);
  strategy(target, typeof ctx.body === 'string' ? ctx.body : JSON.stringify(ctx.body));

  // Restore focus IMMEDIATELY after swap (synchronously)
  if (shouldRestoreFocus && activeElement instanceof HTMLElement) {
    // Check if element is still in DOM and focusable
    if (document.body.contains(activeElement)) {
      activeElement.focus();
      // Restore cursor position for text inputs
      if ((activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) && 
          selectionStart !== null && selectionEnd !== null) {
        try {
          activeElement.setSelectionRange(selectionStart, selectionEnd);
        } catch {
          // Some input types don't support setSelectionRange
        }
      }
    }
  }

  return ctx;
}

