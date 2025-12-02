/**
 * @param {number} attempt
 * @param {{ baseDelay: number; maxDelay: number; jitter?: number }} options
 */
export function calculateDelay(attempt, { baseDelay, maxDelay, jitter = 0 }) {
  const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
  return applyJitter(delay, jitter);
}

/**
 * @param {number} delay
 * @param {number} jitter
 */
export function applyJitter(delay, jitter) {
  if (!jitter) {
    return delay;
  }
  const spread = delay * jitter;
  const min = delay - spread;
  const max = delay + spread;
  return Math.round(Math.random() * (max - min) + min);
}

