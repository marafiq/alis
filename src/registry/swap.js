import { createRegistry } from './base.js';
import { swap as innerHTMLSwap } from '../swap/inner-html.js';
import { swap as outerHTMLSwap } from '../swap/outer-html.js';
import { swap as noSwap } from '../swap/none.js';

const registry = createRegistry({ name: 'ALIS.swap', allowOverride: true });

registry.register('innerHTML', innerHTMLSwap);
registry.register('outerHTML', outerHTMLSwap);
registry.register('none', noSwap);

export function getSwapStrategy(name = 'innerHTML') {
  const swapper = registry.get(name);
  if (!swapper) {
    throw new Error(`Unknown swap strategy "${name}"`);
  }
  return swapper;
}

/**
 * @param {string} name
 * @param {(target: Element, content: string) => Element | null | undefined} swapper
 */
export function registerSwapStrategy(name, swapper) {
  return registry.register(name, swapper, { override: true });
}

export function listSwapStrategies() {
  return registry.keys();
}

export function clearSwapStrategies() {
  registry.clear();
  registry.register('innerHTML', innerHTMLSwap);
  registry.register('outerHTML', outerHTMLSwap);
  registry.register('none', noSwap);
}

