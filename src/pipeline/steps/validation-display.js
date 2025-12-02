import { clearErrors, displayErrors } from '../../validation/display.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export function validationDisplayStep(ctx) {
  const form = resolveForm(ctx.element);
  if (!form) {
    return ctx;
  }

  clearErrors(form);
  if (ctx.validation) {
    displayErrors(form, ctx.validation);
  }
  return ctx;
}

/**
 * @param {Element | null} element
 */
function resolveForm(element) {
  if (!element) {
    return null;
  }
  if (element instanceof HTMLFormElement) {
    return element;
  }
  return element.closest('form');
}

