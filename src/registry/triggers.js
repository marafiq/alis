import { createRegistry } from './base.js';

const registry = createRegistry({ name: 'ALIS.triggers', allowOverride: true });

/**
 * @param {string} name
 * @param {(event: Event) => boolean} handler
 */
export function registerTrigger(name, handler) {
  return registry.register(name, handler, { override: true });
}

/**
 * @param {string} name
 */
export function getTrigger(name) {
  return registry.get(name);
}

export function listTriggers() {
  return registry.keys();
}

export function clearTriggers() {
  registry.clear();
}

