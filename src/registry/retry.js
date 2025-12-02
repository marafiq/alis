import { createRegistry } from './base.js';
import { calculateDelay } from '../retry/backoff.js';

const registry = createRegistry({ name: 'ALIS.retry', allowOverride: true });

registry.register('default', {
  maxAttempts: 3,
  statusCodes: [408, 429, 500, 502, 503, 504],
  baseDelay: 1_000,
  maxDelay: 30_000,
  jitter: 0.2,
  calculateDelay
});

export function getRetryPolicy(name = 'default') {
  const policy = registry.get(name);
  if (!policy) {
    throw new Error(`Unknown retry policy "${name}"`);
  }
  return policy;
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} policy
 */
export function registerRetryPolicy(name, policy) {
  return registry.register(name, policy, { override: true });
}

export function listRetryPolicies() {
  return registry.keys();
}

export function clearRetryPolicies() {
  registry.clear();
  registry.register('default', {
    maxAttempts: 3,
    statusCodes: [408, 429, 500, 502, 503, 504],
    baseDelay: 1_000,
    maxDelay: 30_000,
    jitter: 0.2,
    calculateDelay
  });
}

