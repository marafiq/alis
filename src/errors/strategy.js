import { ALISError } from './types.js';

/**
 * @typedef {'error' | 'warn' | 'info' | 'debug'} LogLevel
 */

const LEVELS = /** @type {const} */ (['error', 'warn', 'info', 'debug']);
const DEFAULT_LOGGER = /** @type {{ [key: string]: (...args: unknown[]) => void }} */ (
  /** @type {unknown} */ (console)
);

/**
 * @param {unknown} error
 * @param {{ behavior?: 'throw' | 'suppress'; level?: LogLevel; onError?: (error: Error) => void }} strategy
 * @param {{ [key: string]: (...args: unknown[]) => void }} logger
 */
export function handleError(error, strategy = {}, logger = DEFAULT_LOGGER) {
  const resolvedError = normalizeError(error);
  const behavior = strategy.behavior === 'suppress' ? 'suppress' : 'throw';
  const requestedLevel = typeof strategy.level === 'string' ? strategy.level : undefined;
  let level;
  if (requestedLevel && LEVELS.includes(/** @type {LogLevel} */ (requestedLevel))) {
    level = /** @type {LogLevel} */ (requestedLevel);
  } else {
    level = 'error';
  }

  const logMethod =
    typeof logger[level] === 'function'
      ? logger[level].bind(logger)
      : typeof logger.error === 'function'
      ? logger.error.bind(logger)
      : () => {};
  logMethod(`[ALIS] ${resolvedError.message}`, resolvedError);

  if (typeof strategy.onError === 'function') {
    try {
      strategy.onError(resolvedError);
    } catch (hookError) {
      logger?.error?.('[ALIS] Error handler threw', hookError);
    }
  }

  if (behavior === 'suppress') {
    return resolvedError;
  }

  throw resolvedError;
}

/**
 * @param {unknown} error
 * @returns {Error}
 */
function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new ALISError(error);
  }

  return new ALISError('Unknown error', 'UNKNOWN', { error });
}

