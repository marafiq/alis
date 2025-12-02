import { resolveElement } from '../utils/element-utils.js';

/**
 * @param {Element | null} element
 * @param {string | undefined} collectOption
 * @returns {Element | null}
 */
export function resolveCollectSource(element, collectOption = undefined) {
  if (collectOption === 'none') {
    return null;
  }

  if (collectOption && collectOption.startsWith('closest:')) {
    const selector = collectOption.replace('closest:', '');
    const closest = element?.closest(selector);
    if (!closest) {
      throw new Error(`collect target "${collectOption}" not found`);
    }
    return closest;
  }

  if (collectOption && collectOption !== 'self') {
    return resolveElement(collectOption);
  }

  if (collectOption === 'self') {
    return element || null;
  }

  if (element instanceof HTMLFormElement) {
    return element;
  }

  if (element && element.closest) {
    const form = element.closest('form');
    if (form) {
      return form;
    }
  }

  return element || null;
}

