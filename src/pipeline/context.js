import { DEFAULTS } from '../config/defaults.js';
import { mergeConfig } from '../config/merger.js';
import { getDefaultTrigger } from '../triggers/defaults.js';

const CONTEXT_VERSION = 1;
let contextCounter = 0;

/**
 * @typedef {Object} PipelineContext
 * @property {number} version
 * @property {string} id
 * @property {Element | null} element
 * @property {Record<string, unknown>} config
 * @property {string} trigger
 * @property {{ attempts: number; aborted: boolean; startTime: number | null; endTime: number | null; duration: number | null }} state
 * @property {{ url: string; method: string; headers: Record<string, string>; body: any } | null} request
 * @property {Response | null} response
 * @property {unknown} body
 * @property {Record<string, unknown> | null} validation
 * @property {Error | null} error
 * @property {{ source: Element | null; data: unknown } | null} collect
 * @property {boolean} success
 */

/**
 * @param {Element | null} element
 * @param {{ config?: Record<string, unknown>; trigger?: string; id?: string }} overrides
 * @returns {PipelineContext}
 */
export function createContext(element, overrides = {}) {
  const baseConfig = mergeConfig(DEFAULTS, overrides.config || {});
  const trigger = overrides.trigger ?? getTriggerFromElement(element);
  const id = overrides.id || generateContextId();

  return {
    version: CONTEXT_VERSION,
    id,
    element,
    config: baseConfig,
    trigger,
    state: {
      attempts: 0,
      aborted: false,
      startTime: null,
      endTime: null,
      duration: null
    },
    request: null,
    response: null,
    body: null,
    validation: null,
    error: null,
    collect: null,
    success: false
  };
}

/**
 * @param {{ element?: Element | null; config?: Record<string, unknown>; trigger?: string; id?: string }} options
 */
/**
 * @param {{ element?: Element | null; config?: Record<string, unknown>; trigger?: string; id?: string }} options
 * @returns {PipelineContext}
 */
export function createContextFromOptions(options = {}) {
  if (!options || typeof options !== 'object') {
    throw new TypeError('createContextFromOptions expects an object');
  }
  const { element = null, config = {}, trigger, id } = options;
  return createContext(element, { config, trigger, id });
}

export function generateContextId() {
  contextCounter += 1;
  return `alis-${Date.now()}-${contextCounter}`;
}

/**
 * @param {Element | null} element
 */
function getTriggerFromElement(element) {
  if (!element) {
    return 'manual';
  }
  return getDefaultTrigger(element);
}

