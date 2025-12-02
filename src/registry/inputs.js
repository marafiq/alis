import { createRegistry } from './base.js';

const registry = createRegistry({ name: 'ALIS.inputs', allowOverride: true });

/**
 * @param {string} type
 * @param {(element: Element) => { name: string; value: unknown }} reader
 */
export function registerInput(type, reader) {
  return registry.register(type, reader, { override: true });
}

/**
 * @param {string} type
 */
export function getInputReader(type) {
  return registry.get(type);
}

export function listInputTypes() {
  return registry.keys();
}

export function clearInputReaders() {
  registry.clear();
}

