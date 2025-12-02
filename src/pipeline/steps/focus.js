/**
 * Focus restoration step - runs as the final step in the pipeline.
 * 
 * Focus priority:
 * 1. If config.focus is specified, focus that element
 * 2. If trigger element is focusable and still in DOM, focus it
 * 3. Otherwise, don't change focus
 * 
 * @param {import('../context.js').PipelineContext} ctx
 */
export function focusStep(ctx) {
  // Skip if there was an error (let error handling deal with focus)
  if (ctx.error) {
    return ctx;
  }

  // Check for explicit focus target in config
  const focusTarget = ctx.config?.focus;
  if (focusTarget) {
    const targetElement = typeof focusTarget === 'string' 
      ? document.querySelector(focusTarget)
      : focusTarget;
    
    if (targetElement instanceof HTMLElement && isFocusable(targetElement)) {
      targetElement.focus();
      return ctx;
    }
  }

  // Default: focus the trigger element if it's focusable
  const element = ctx.element;
  if (element instanceof HTMLElement && isFocusable(element) && document.body.contains(element)) {
    // Only focus if the element doesn't already have focus
    if (document.activeElement !== element) {
      element.focus();
    }
  }

  return ctx;
}

/**
 * Check if an element is focusable
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function isFocusable(element) {
  // Element must be visible
  if (element.offsetParent === null && element.style.position !== 'fixed') {
    return false;
  }

  // Check if disabled
  if ('disabled' in element && element.disabled) {
    return false;
  }

  // Check tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex !== null && parseInt(tabindex, 10) < 0) {
    return false;
  }

  // Natively focusable elements
  const focusableTags = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'];
  if (focusableTags.includes(element.tagName)) {
    // Anchor needs href to be focusable
    if (element.tagName === 'A' && !element.hasAttribute('href')) {
      return tabindex !== null;
    }
    return true;
  }

  // Elements with tabindex >= 0 are focusable
  if (tabindex !== null && parseInt(tabindex, 10) >= 0) {
    return true;
  }

  // contenteditable elements are focusable
  if (element.isContentEditable) {
    return true;
  }

  return false;
}

