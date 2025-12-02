import { executeConfirm } from './registry.js';
import { resolveElement } from '../utils/element-utils.js';

/**
 * @param {string | Element} selectorOrElement
 * @param {import('../pipeline/context.js').PipelineContext} ctx
 */
export async function executeElementConfirm(selectorOrElement, ctx) {
  const element = typeof selectorOrElement === 'string' ? resolveElement(selectorOrElement) : selectorOrElement;
  if (!element) {
    throw new Error('executeElementConfirm: element not found');
  }

  const confirmName = element.getAttribute('data-alis-confirm');
  if (confirmName) {
    return executeConfirm(confirmName, ctx);
  }

  const message = element.getAttribute('data-alis-confirm-message') || 'Are you sure?';
  if (typeof window.confirm === 'function') {
    return window.confirm(message);
  }
  return true;
}

