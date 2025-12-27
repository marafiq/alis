import { getEventLevel, LEVELS, shouldLog } from './levels.js';

/**
 * @typedef {import('./levels.js').TelemetryLevel} TelemetryLevel
 * @typedef {{ event: string; level: TelemetryLevel; timestamp: number; data: unknown }} TelemetryPayload
 * @typedef {{ emit(event: string, payload: TelemetryPayload): void }} TelemetryAdapter
 * @typedef {{ name: string; startTime: number; attributes: Record<string, unknown> }} Span
 */

/** @type {TelemetryLevel} */
let currentLevel = 'none';

/** @type {TelemetryAdapter[]} */
let adapters = [];

/**
 * @param {string} eventName
 * @param {unknown} data
 * @param {{ level?: TelemetryLevel }} options
 * @returns {false | TelemetryPayload}
 */
export function emit(eventName, data = {}, options = {}) {
  if (typeof eventName !== 'string' || eventName.length === 0) {
    return false;
  }

  const level = options.level ?? getEventLevel(eventName);
  if (!shouldLog(currentLevel, level)) {
    return false;
  }

  const payload = {
    event: eventName,
    level,
    timestamp: Date.now(),
    data
  };

  for (const adapter of adapters) {
    adapter.emit(eventName, payload);
  }

  return payload;
}

/**
 * Start a span for timing an operation.
 * @param {string} name
 * @param {Record<string, unknown>} attributes
 * @returns {Span}
 */
export function startSpan(name, attributes = {}) {
  const span = {
    name,
    startTime: performance.now(),
    attributes
  };

  emit(`${name}:start`, { ...attributes });
  return span;
}

/**
 * End a span and emit timing data.
 * @param {Span} span
 * @param {Record<string, unknown>} attributes
 */
export function endSpan(span, attributes = {}) {
  const duration = performance.now() - span.startTime;
  emit(`${span.name}:end`, {
    ...span.attributes,
    ...attributes,
    durationMs: Math.round(duration * 100) / 100
  });
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
 * Add an adapter to receive telemetry events.
 * @param {TelemetryAdapter} adapter
 */
export function addAdapter(adapter) {
  if (!adapter || typeof adapter.emit !== 'function') {
    throw new TypeError('Adapter must have emit(event, payload) function');
  }
  if (!adapters.includes(adapter)) {
    adapters.push(adapter);
  }
}

/**
 * Remove an adapter.
 * @param {TelemetryAdapter} adapter
 */
export function removeAdapter(adapter) {
  const index = adapters.indexOf(adapter);
  if (index !== -1) {
    adapters.splice(index, 1);
  }
}

/**
 * Get all registered adapters.
 * @returns {TelemetryAdapter[]}
 */
export function getAdapters() {
  return [...adapters];
}

/**
 * Console adapter - logs to browser console.
 * @returns {TelemetryAdapter}
 */
export function createConsoleAdapter() {
  return {
    emit(event, payload) {
      const method = payload.level === 'error' ? 'error'
        : payload.level === 'warn' ? 'warn'
        : payload.level === 'info' ? 'info'
        : 'debug';
      console[method](`[ALIS:${event}]`, payload.data);
    }
  };
}

/**
 * Callback adapter - calls a function for each event.
 * @param {(event: string, payload: TelemetryPayload) => void} callback
 * @returns {TelemetryAdapter}
 */
export function createCallbackAdapter(callback) {
  return {
    emit(event, payload) {
      callback(event, payload);
    }
  };
}

/**
 * Buffer adapter - stores events in an array for later retrieval.
 * @param {number} maxSize
 * @returns {TelemetryAdapter & { getEvents(): TelemetryPayload[]; clear(): void }}
 */
export function createBufferAdapter(maxSize = 100) {
  /** @type {TelemetryPayload[]} */
  const buffer = [];
  return {
    emit(_event, payload) {
      buffer.push(payload);
      if (buffer.length > maxSize) {
        buffer.shift();
      }
    },
    getEvents() {
      return [...buffer];
    },
    clear() {
      buffer.length = 0;
    }
  };
}

export function _resetTelemetry() {
  currentLevel = 'none';
  adapters = [];
}
