export const LEVELS = Object.freeze({
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
});

/**
 * @typedef {keyof typeof LEVELS} TelemetryLevel
 */

export const EVENT_LEVELS = /** @type {Record<string, TelemetryLevel>} */ (
  Object.freeze({
  error: 'error',
  'validate:error': 'error',
  'request:timeout': 'error',
  'request:abort': 'warn',
  'request:retry': 'warn',
  'coordinate:duplicate': 'warn',
  'validation:display': 'warn',
  'hooks:error': 'error',
  'hooks:success': 'info',
  'swap:start': 'info',
  'swap:complete': 'info',
  trigger: 'debug',
  collect: 'debug',
  complete: 'info'
})
);

/**
 * @param {string} eventName
 * @param {Record<string, TelemetryLevel>} overrides
 * @returns {TelemetryLevel}
 */
export function getEventLevel(eventName, overrides = {}) {
  if (typeof overrides[eventName] === 'string') {
    return normalizeLevel(overrides[eventName]);
  }

  if (Object.prototype.hasOwnProperty.call(EVENT_LEVELS, eventName)) {
    return /** @type {TelemetryLevel} */ (EVENT_LEVELS[eventName]);
  }

  if (eventName.includes('error')) {
    return 'error';
  }

  if (eventName.includes('warn') || eventName.includes('retry')) {
    return 'warn';
  }

  return 'info';
}

/**
 * @param {TelemetryLevel} currentLevel
 * @param {TelemetryLevel} eventLevel
 */
export function shouldLog(currentLevel = 'none', eventLevel = 'info') {
  const currentRank = LEVELS[normalizeLevel(currentLevel)] ?? LEVELS.none;
  const eventRank = LEVELS[normalizeLevel(eventLevel)] ?? LEVELS.info;
  return currentRank >= eventRank && currentRank > LEVELS.none;
}

/**
 * @param {string} level
 * @returns {TelemetryLevel}
 */
function normalizeLevel(level) {
  return isTelemetryLevel(level) ? level : 'info';
}

/**
 * @param {string} level
 * @returns {level is TelemetryLevel}
 */
function isTelemetryLevel(level) {
  return Object.prototype.hasOwnProperty.call(LEVELS, level);
}

