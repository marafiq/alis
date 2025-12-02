import { getEventLevel, LEVELS, shouldLog } from './levels.js';

/**
 * @typedef {import('./levels.js').TelemetryLevel} TelemetryLevel
 * @typedef {{ event: string; level: TelemetryLevel; timestamp: number; data: unknown }} TelemetryPayload
 * @typedef {{ emit(event: string, payload: TelemetryPayload): void }} TelemetryAdapter
 */

const consoleAdapter = /** @type {TelemetryAdapter} */ ({
  emit(event, payload) {
    const method = levelToConsole(payload.level);
    if (typeof console[method] === 'function') {
      console[method](`[ALIS:${event}]`, payload);
    }
  }
});

/** @type {TelemetryLevel} */
let currentLevel = 'none';
/** @type {TelemetryAdapter} */
let adapter = consoleAdapter;

/**
 * @param {string} eventName
 * @param {unknown} data
 * @param {{ level?: TelemetryLevel; levels?: Record<string, TelemetryLevel> }} options
 * @returns {false | TelemetryPayload}
 */
export function emit(eventName, data = {}, options = {}) {
  if (typeof eventName !== 'string' || eventName.length === 0) {
    throw new TypeError('eventName must be a non-empty string');
  }

  const level = options.level ?? getEventLevel(eventName, options.levels);
  if (!shouldLog(currentLevel, level)) {
    return false;
  }

  const payload = {
    event: eventName,
    level,
    timestamp: Date.now(),
    data
  };

  adapter.emit(eventName, payload);
  return payload;
}

/**
 * @param {TelemetryLevel} level
 */
export function setLevel(level) {
  if (!Object.prototype.hasOwnProperty.call(LEVELS, level)) {
    throw new Error(`Unknown telemetry level "${level}"`);
  }
  currentLevel = level;
}

export function getLevel() {
  return currentLevel;
}

/**
 * @param {TelemetryAdapter} newAdapter
 */
export function setAdapter(newAdapter) {
  if (!newAdapter || typeof newAdapter.emit !== 'function') {
    throw new TypeError('Telemetry adapter must supply an emit(event, payload) function');
  }
  adapter = newAdapter;
}

export function getAdapter() {
  return adapter;
}

export function _resetTelemetry() {
  currentLevel = 'none';
  adapter = consoleAdapter;
}

/**
 * @param {TelemetryLevel} level
 */
function levelToConsole(level) {
  switch (level) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warn';
    case 'info':
      return 'info';
    default:
      return 'debug';
  }
}

