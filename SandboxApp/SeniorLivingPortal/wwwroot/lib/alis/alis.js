/*! alis-fetch v0.0.1 | MIT */
var ALISBundle = (function (exports) {
  'use strict';

  const METHODS = Object.freeze(['get', 'post', 'put', 'patch', 'delete']);

  const DEFAULTS = deepFreeze({
    timeout: 30_000,
    credentials: 'same-origin',
    retry: {
      maxAttempts: 3,
      statusCodes: [408, 429, 500, 502, 503, 504],
      baseDelay: 1_000,
      maxDelay: 30_000,
      jitter: 0.2
    },
    duplicateRequest: 'ignore',
    errors: {
      handlerThrows: 'continue',
      targetNotFound: 'warn',
      collectFails: 'abort',
      duplicateRequest: 'ignore'
    },
    telemetry: 'none'
  });

  /**
   * @template T extends Record<string, unknown>
   * @param {T} target
   * @returns {Readonly<T>}
   */
  function deepFreeze(target) {
    const record = /** @type {Record<string, unknown>} */ (target);
    Object.getOwnPropertyNames(record).forEach(prop => {
      const value = record[prop];
      if (value && typeof value === 'object') {
        deepFreeze(value);
      }
    });
    return Object.freeze(target);
  }

  /**
   * @param {unknown} value
   * @returns {value is Record<string, unknown>}
   */
  const isObject = value =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

  /**
   * @param {Record<string, unknown>} globalConfig
   * @param {Record<string, unknown>} elementConfig
   * @returns {Record<string, unknown>}
   */
  function mergeConfig(globalConfig = {}, elementConfig = {}) {
    if (!isObject(globalConfig)) {
      throw new TypeError('globalConfig must be an object');
    }
    if (!isObject(elementConfig)) {
      throw new TypeError('elementConfig must be an object');
    }
    return deepMerge(globalConfig, elementConfig);
  }

  /**
   * @param {Record<string, unknown>} base
   * @param {Record<string, unknown>} override
   */
  function deepMerge(base, override) {
    const result = { ...base };

    for (const [key, value] of Object.entries(override)) {
      const current = result[key];

      if (isObject(current) && isObject(value)) {
        result[key] = deepMerge(current, value);
      } else if (Array.isArray(value)) {
        result[key] = [...value];
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * @param {Element} element
   */
  function getDefaultTrigger(element) {
    if (element instanceof HTMLFormElement) {
      return 'submit';
    }
    if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      return 'change';
    }
    return 'click';
  }

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
   * @property {{ errors?: Record<string, string[]> } | null} validation
   * @property {Error | null} error
   * @property {{ source: Element | null; data: unknown } | null} collect
   * @property {{ apply: () => void; restore: () => void } | null} stateManager
   * @property {boolean} success
   */

  /**
   * @param {Element | null} element
   * @param {{ config?: Record<string, unknown>; trigger?: string; id?: string }} overrides
   * @returns {PipelineContext}
   */
  function createContext(element, overrides = {}) {
    const baseConfig = mergeConfig(DEFAULTS, overrides.config || {});
    const trigger = overrides.trigger ?? getTriggerFromElement(element);
    const id = overrides.id || generateContextId();

    return {
      version: CONTEXT_VERSION,
      id,
      element,
      config: baseConfig,
      trigger,
      abortController: new AbortController(),
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
      stateManager: null,
      success: false
    };
  }

  function generateContextId() {
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

  const LEVELS = Object.freeze({
    none: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4
  });

  /**
   * @typedef {keyof typeof LEVELS} TelemetryLevel
   */

  const EVENT_LEVELS = /** @type {Record<string, TelemetryLevel>} */ (
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
  function getEventLevel(eventName, overrides = {}) {
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
  function shouldLog(currentLevel = 'none', eventLevel = 'info') {
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
  function emit(eventName, data = {}, options = {}) {
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

  /**
   * @typedef {import('./context.js').PipelineContext} PipelineContext
   */

  /**
   * @param {PipelineContext} context
   * @param {Array<(ctx: PipelineContext) => Promise<PipelineContext> | PipelineContext>} steps
   * @returns {Promise<PipelineContext>}
   */
  async function runPipeline(context, steps = []) {
    let currentContext = context;

    for (const step of steps) {
      if (currentContext.state.aborted) {
        emit('pipeline:aborted', { id: currentContext.id });
        break;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        currentContext = await step(currentContext);
      } catch (error) {
        currentContext.error = error instanceof Error ? error : new Error(String(error));
        emit('pipeline:error', { id: currentContext.id, error });
        // Do not throw; continue to allow cleanup steps to run.
        // Steps should guard themselves against existing errors if they require success.
      }
    }

    emit('pipeline:complete', { id: currentContext.id });
    return currentContext;
  }

  class ALISError extends Error {
    /**
     * @param {string} message
     * @param {string} code
     * @param {Record<string, unknown>} context
     */
    constructor(message, code = 'ALIS_ERROR', context = {}) {
      super(message);
      this.name = this.constructor.name;
      this.code = code;
      this.context = context;
    }
  }

  class ConfigError extends ALISError {
    constructor(message = 'Configuration error', context = {}) {
      super(message, 'CONFIG_ERROR', context);
    }
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function validateStep(ctx) {
    const { config } = ctx;

    if (!config || typeof config !== 'object') {
      throw new ConfigError('Missing configuration', { ctx });
    }

    // URL is required for any request
    if (!config.url) {
      throw new ConfigError('Missing URL in configuration', { id: ctx.id });
    }

    // Element is optional for programmatic API (ALIS.request)
    // but required for declarative (data-alis) usage

    return ctx;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  async function confirmStep(ctx) {
    const confirmHandler = ctx.config.confirm;
    if (typeof confirmHandler !== 'function') {
      return ctx;
    }

    const confirmResult = await confirmHandler(ctx);
    if (confirmResult === false) {
      ctx.state.aborted = true;
    }
    return ctx;
  }

  const ACTIVE_REQUESTS = new Map();

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function coordinateStep(ctx) {
    const element = ctx.element;
    if (!element) {
      return ctx;
    }

    const key = element;
    const strategy = ctx.config.duplicateRequest || 'ignore';
    // keep silent in production – telemetry can be wired via hooks

    if (!ACTIVE_REQUESTS.has(key)) {
      ACTIVE_REQUESTS.set(key, { id: ctx.id, controller: ctx.abortController });
      return ctx;
    }

    switch (strategy) {
      case 'ignore':
        ctx.state.aborted = true;
        break;
      case 'abort-previous':
        {
          const prev = ACTIVE_REQUESTS.get(key);
          if (prev && prev.controller) {
            prev.controller.abort();
          }
          ACTIVE_REQUESTS.set(key, { id: ctx.id, controller: ctx.abortController });
        }
        break;
      case 'queue':
        // future enhancement
        break;
      default:
        ctx.state.aborted = true;
    }

    return ctx;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function coordinateCleanupStep(ctx) {
    const entry = ACTIVE_REQUESTS.get(ctx.element);
    if (ctx.element && entry && entry.id === ctx.id) {
      ACTIVE_REQUESTS.delete(ctx.element);
    }
    return ctx;
  }

  /**
   * @param {Element} element
   */
  /**
   * @param {Element} element
   */
  function captureState(element) {
    const state = {
      disabled: element instanceof HTMLButtonElement || element instanceof HTMLInputElement
        ? element.disabled
        : false,
      ariaBusy: element.getAttribute('aria-busy'),
      classList: Array.from(element.classList),
      textContent: element instanceof HTMLElement ? element.textContent ?? '' : ''
    };

    return state;
  }

  /**
   * @param {Element} element
   * @param {{ indicator?: string; disabled?: boolean; debounced?: boolean }} config
   */
  function applyEffects(element, config = {}) {
    // Don't disable anything if the request is debounced - user is still interacting
    const shouldDisable = !config.debounced;
    
    if (shouldDisable) {
      if (element instanceof HTMLButtonElement || 
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement) {
        element.disabled = true;
      }
    }
    
    element.setAttribute('aria-busy', 'true');
    
    // Also set aria-busy on parent form if element is within a form
    const form = element.closest('form');
    if (form && form !== element) {
      form.setAttribute('aria-busy', 'true');
    }

    if (config.indicator) {
      const { className, selector } = parseIndicator(config.indicator);
      if (className) {
        element.classList.add(className);
      }
      if (selector) {
        const indicatorEl = document.querySelector(selector);
        if (indicatorEl) {
          indicatorEl.removeAttribute('hidden');
        }
      }
    }
  }

  /**
   * Parse indicator config: "class, #selector" or "class@selector" or just "class"
   * @param {string} indicator
   * @returns {{ className: string; selector: string }}
   */
  function parseIndicator(indicator) {
    if (!indicator) return { className: '', selector: '' };
    
    // Support both "class, #selector" and "class@selector" formats
    let className = '';
    let selector = '';
    
    if (indicator.includes(',')) {
      const parts = indicator.split(',').map(s => s.trim());
      className = parts[0] || '';
      selector = parts[1] || '';
    } else if (indicator.includes('@')) {
      const parts = indicator.split('@');
      className = parts[0] || '';
      selector = parts[1] || '';
    } else {
      className = indicator;
    }
    
    return { className, selector };
  }

  /**
   * @param {Element} element
   * @param {ReturnType<import('./capture.js').captureState>} state
   */
  /**
   * @param {Element} element
   * @param {{ disabled: boolean; ariaBusy: string | null; classList: string[]; textContent: string } | null} state
   */
  function restoreState(element, state) {
    if (!state) return;

    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) {
      element.disabled = state.disabled;
    }
    if (state.ariaBusy == null) {
      element.removeAttribute('aria-busy');
    } else {
      element.setAttribute('aria-busy', state.ariaBusy);
    }
    
    // Also restore aria-busy on parent form
    const form = element.closest('form');
    if (form && form !== element) {
      form.removeAttribute('aria-busy');
    }

    element.className = state.classList.join(' ');

    // Only restore textContent for button elements, NOT for selects/inputs
    // Setting textContent on a <select> would destroy all its options!
    if (element instanceof HTMLButtonElement) {
      element.textContent = state.textContent || '';
    }
  }

  /**
   * @param {Element} element
   * @param {{ indicator?: string; debounced?: boolean }} config
   */
  function createStateManager(element, config = {}) {
    const captured = captureState(element);
    const { selector } = config.indicator ? parseIndicator(config.indicator) : { selector: '' };

    return {
      apply() {
        applyEffects(element, config);
      },
      restore() {
        restoreState(element, captured);
        // Re-hide indicator element if we showed it
        if (selector) {
          const indicatorEl = document.querySelector(selector);
          if (indicatorEl) {
            indicatorEl.setAttribute('hidden', '');
          }
        }
      }
    };
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function stateCaptureStep(ctx) {
    const target =
      ctx.config.triggerElement && ctx.config.triggerElement instanceof Element
        ? ctx.config.triggerElement
        : ctx.element;

    if (!target) {
      return ctx;
    }

    const indicator = typeof ctx.config.indicator === 'string' ? ctx.config.indicator : undefined;
    const debounced = ctx.config.debounced === true;

    ctx.stateManager = createStateManager(target, {
      indicator,
      debounced
    });

    return ctx;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function stateApplyStep(ctx) {
    ctx.stateManager?.apply();
    return ctx;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  async function hooksBeforeStep(ctx) {
    if (!ctx.config.onBefore) {
      return ctx;
    }

    emit('hooks:before:start', { id: ctx.id });

    const handlers = Array.isArray(ctx.config.onBefore)
      ? ctx.config.onBefore
      : [ctx.config.onBefore];

    for (const handler of handlers) {
      if (typeof handler === 'function') {
        // eslint-disable-next-line no-await-in-loop
        const result = await handler(ctx);
        if (result === false) {
          ctx.state.aborted = true;
          break;
        }
      }
    }

    emit('hooks:before:complete', { id: ctx.id });
    return ctx;
  }

  /**
   * @param {Element} element
   * @returns {{ name: string; value: unknown } | null}
   */
  function readValue(element) {
    if (!element || !element.getAttribute) {
      return null;
    }

    const name = element.getAttribute('name');
    if (!name || ('disabled' in element && /** @type {any} */ (element).disabled)) {
      return null;
    }

    // Check for custom value selector: data-alis-value="#selector@attribute"
    const customValueAttr = element.getAttribute('data-alis-value');
    if (customValueAttr) {
      const value = readCustomValue(customValueAttr);
      return { name, value };
    }

    // Check for custom value function: data-alis-value-fn="functionName"
    const customValueFn = element.getAttribute('data-alis-value-fn');
    if (customValueFn && typeof window !== 'undefined') {
      const fn = /** @type {Record<string, unknown>} */ (window)[customValueFn];
      if (typeof fn === 'function') {
        return { name, value: fn(element) };
      }
    }

    // Check for Syncfusion component (ej2_instances array)
    const ej2Instances = /** @type {any} */ (element)['ej2_instances'];
    if (Array.isArray(ej2Instances) && ej2Instances.length > 0) {
      const instance = ej2Instances[0];
      // CheckBox uses 'checked' property
      if ('checked' in instance) {
        return instance.checked ? { name, value: 'true' } : null;
      }
      // Most components use 'value' property
      if ('value' in instance) {
        return { name, value: instance.value };
      }
    }

    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        return element.checked ? { name, value: element.value || 'on' } : null;
      }
      if (element.type === 'radio') {
        return element.checked ? { name, value: element.value } : null;
      }
      return { name, value: element.value };
    }

    if (element instanceof HTMLSelectElement) {
      if (element.multiple) {
        const values = Array.from(element.selectedOptions).map(option => option.value);
        return { name, value: values };
      }
      return { name, value: element.value };
    }

    if (element instanceof HTMLTextAreaElement) {
      return { name, value: element.value };
    }

    if (element instanceof HTMLButtonElement) {
      return { name, value: element.value };
    }

    return null;
  }

  /**
   * Read value from custom selector
   * Format: "#selector@attribute" or "#selector .child@attribute"
   * If no @attribute, uses textContent
   * 
   * @param {string} selectorAttr
   * @returns {string}
   */
  function readCustomValue(selectorAttr) {
    if (!selectorAttr) return '';
    
    let selector = selectorAttr;
    let attribute = 'value'; // default
    
    // Check for @attribute suffix
    const atIndex = selectorAttr.lastIndexOf('@');
    if (atIndex > 0) {
      selector = selectorAttr.substring(0, atIndex);
      attribute = selectorAttr.substring(atIndex + 1);
    }
    
    const targetEl = document.querySelector(selector);
    if (!targetEl) return '';
    
    // Special handling for common attributes
    if (attribute === 'value' && 'value' in targetEl) {
      return /** @type {HTMLInputElement} */ (targetEl).value;
    }
    if (attribute === 'textContent') {
      return targetEl.textContent || '';
    }
    if (attribute === 'innerHTML') {
      return targetEl.innerHTML || '';
    }
    
    // Check for data-* attribute
    if (attribute.startsWith('data-')) {
      return targetEl.getAttribute(attribute) || '';
    }
    
    // Generic attribute
    return targetEl.getAttribute(attribute) || '';
  }

  /**
   * @param {HTMLFormElement} form
   * @returns {Record<string, unknown>}
   */
  function readFormValues(form) {
    if (!(form instanceof HTMLFormElement)) {
      throw new TypeError('readFormValues expects a form element');
    }
    /** @type {Record<string, any>} */
    const entries = {};
    Array.from(form.elements).forEach(element => {
      const reading = readValue(element);
      if (!reading) {
        return;
      }
      const { name, value } = reading;
      if (entries[name] === undefined) {
        entries[name] = value;
      } else if (Array.isArray(entries[name])) {
        entries[name].push(value);
      } else {
        entries[name] = [entries[name], value];
      }
    });
    return entries;
  }

  /**
   * @param {Element} container
   * @returns {Record<string, unknown>}
   */
  function readContainerValues(container) {
    if (!(container instanceof Element)) {
      throw new TypeError('readContainerValues expects an Element');
    }
    /** @type {Record<string, any>} */
    const entries = {};
    const fields = container.querySelectorAll('[name]');
    fields.forEach(field => {
      const reading = readValue(field);
      if (reading) {
        entries[reading.name] = reading.value;
      }
    });
    return entries;
  }

  /**
   * @param {Element | null} element
   */

  /**
   * @param {string | Element} target
   * @param {Document | Element} root
   */
  function resolveElement(target, root = document) {
    if (!target) {
      throw new Error('resolveElement: target is required');
    }
    if (target instanceof Element) {
      return target;
    }
    if (typeof target === 'string') {
      const resolved = root.querySelector(target);
      if (!resolved) {
        throw new Error(`Element not found for selector "${target}"`);
      }
      return resolved;
    }
    throw new TypeError('resolveElement: unsupported target type');
  }

  /**
   * @param {Element | null} element
   * @param {string | undefined} collectOption
   * @returns {Element | null}
   */
  function resolveCollectSource(element, collectOption = undefined) {
    if (collectOption === 'none') {
      return null;
    }

    if (collectOption && collectOption.startsWith('closest:')) {
      const selector = collectOption.replace('closest:', '');
      const closest = element?.closest(selector);
      if (!closest) {
        throw new Error(`collect target "${collectOption}" not found`);
      }
      return closest;
    }

    if (collectOption && collectOption !== 'self') {
      return resolveElement(collectOption);
    }

    if (collectOption === 'self') {
      return element || null;
    }

    if (element instanceof HTMLFormElement) {
      return element;
    }

    if (element && element.closest) {
      const form = element.closest('form');
      if (form) {
        return form;
      }
    }

    return element || null;
  }

  /**
   * @param {Element | null} element
   * @param {{ collect?: string }} options
   */
  function collect(element, options = {}) {
    const source = resolveCollectSource(element, options.collect);
    if (!source) {
      return { data: null, source: null };
    }

    if (source instanceof HTMLFormElement) {
      return {
        source,
        data: readFormValues(source)
      };
    }

    if (source === element && element && element.getAttribute('name')) {
      const field = readValue(element);
      return {
        source: element,
        data: field ? { [field.name]: field.value } : null
      };
    }

    return {
      source,
      data: readContainerValues(source)
    };
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function collectStep(ctx) {
    const collectOption = typeof ctx.config.collect === 'string' ? ctx.config.collect : undefined;
    const result = collect(ctx.element, { collect: collectOption });
    ctx.collect = result;
    return ctx;
  }

  /**
   * @typedef {Object} CombinedValidationResult
   * @property {boolean} isValid - Whether all results are valid
   * @property {string[]} messages - Array of error messages from invalid results
   */

  /**
   * Immutable validation result object.
   * Use static factory methods to create instances.
   */
  class ValidationResult {
    /** @type {boolean} */
    #isValid;
    
    /** @type {string | null} */
    #message;

    /**
     * @param {boolean} isValid
     * @param {string | null} message
     */
    constructor(isValid, message) {
      this.#isValid = isValid;
      this.#message = message;
      Object.freeze(this);
    }

    /** @returns {boolean} */
    get isValid() {
      return this.#isValid;
    }

    /** @returns {string | null} */
    get message() {
      return this.#message;
    }

    /**
     * Creates a valid result.
     * @returns {ValidationResult}
     */
    static valid() {
      return new ValidationResult(true, null);
    }

    /**
     * Creates an invalid result with a message.
     * @param {string} message - The error message
     * @returns {ValidationResult}
     */
    static invalid(message) {
      return new ValidationResult(false, message);
    }

    /**
     * Combines multiple validation results into one.
     * @param {ValidationResult[]} results - Array of validation results
     * @returns {CombinedValidationResult}
     */
    static combine(results) {
      const messages = results
        .filter(r => !r.isValid && r.message !== null)
        .map(r => /** @type {string} */ (r.message));
      
      return {
        isValid: results.every(r => r.isValid),
        messages
      };
    }
  }

  /**
   * @typedef {import('./ValidationResult.js').ValidationResult} ValidationResult
   */

  /**
   * @typedef {(value: unknown, params: Record<string, unknown>, element: Element) => ValidationResult} ValidatorFn
   */

  /**
   * @typedef {Object} RegisterOptions
   * @property {boolean} [override] - Allow overriding existing validator
   */

  /**
   * Registry for validation functions.
   * Validators receive (value, params, element) and return ValidationResult.
   */
  class ValidatorRegistry {
    /** @type {Map<string, ValidatorFn>} */
    #validators = new Map();

    /**
     * Register a validator function.
     * @param {string} name - Validator name (e.g., 'required', 'email')
     * @param {ValidatorFn} validator - Validation function
     * @param {RegisterOptions} [options] - Registration options
     */
    register(name, validator, options = {}) {
      if (this.#validators.has(name) && !options.override) {
        throw new Error(`Validator "${name}" is already registered. Use { override: true } to replace.`);
      }
      this.#validators.set(name, validator);
    }

    /**
     * Get a validator by name.
     * @param {string} name - Validator name
     * @returns {ValidatorFn | undefined}
     */
    get(name) {
      return this.#validators.get(name);
    }

    /**
     * Check if a validator is registered.
     * @param {string} name - Validator name
     * @returns {boolean}
     */
    has(name) {
      return this.#validators.has(name);
    }

    /**
     * Get all registered validator names.
     * @returns {string[]}
     */
    keys() {
      return Array.from(this.#validators.keys());
    }
  }

  /**
   * @typedef {Object} ValidatorConfig
   * @property {string} name - Validator name (e.g., 'required', 'minlength')
   * @property {string} message - Error message
   * @property {Record<string, string>} params - Validator parameters
   */

  /**
   * @typedef {Object} ParsedValidation
   * @property {boolean} enabled - Whether validation is enabled (data-val="true")
   * @property {ValidatorConfig[]} validators - Array of validator configurations
   */

  /**
   * Parse data-val-* attributes from an element.
   * 
   * ASP.NET Core generates attributes like:
   * - data-val="true" - enables validation
   * - data-val-required="Message" - required validator with message
   * - data-val-minlength="Message" - minlength validator
   * - data-val-minlength-min="5" - minlength parameter
   * 
   * @param {Element} element - The element to parse
   * @returns {ParsedValidation}
   */
  function parseValidationAttributes(element) {
    const dataVal = element.getAttribute('data-val');
    const enabled = dataVal === 'true';
    
    if (!enabled) {
      return { enabled: false, validators: [] };
    }
    
    /** @type {Map<string, ValidatorConfig>} */
    const validatorMap = new Map();
    
    // Get all attributes
    const attributes = element.attributes;
    
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      const name = attr.name;
      
      // Skip non-validation attributes
      if (!name.startsWith('data-val-')) {
        continue;
      }
      
      // Remove 'data-val-' prefix
      const remainder = name.substring(9); // 'data-val-'.length = 9
      
      // Check if this is a parameter (contains another hyphen after the validator name)
      const hyphenIndex = remainder.indexOf('-');
      
      if (hyphenIndex === -1) {
        // This is the main validator attribute (e.g., data-val-required)
        const validatorName = remainder;
        
        if (!validatorMap.has(validatorName)) {
          validatorMap.set(validatorName, {
            name: validatorName,
            message: attr.value,
            params: {}
          });
        } else {
          // Update message if validator already exists
          const existing = validatorMap.get(validatorName);
          if (existing) {
            existing.message = attr.value;
          }
        }
      } else {
        // This is a parameter (e.g., data-val-minlength-min)
        const validatorName = remainder.substring(0, hyphenIndex);
        const paramName = remainder.substring(hyphenIndex + 1);
        
        if (!validatorMap.has(validatorName)) {
          validatorMap.set(validatorName, {
            name: validatorName,
            message: '',
            params: {}
          });
        }
        
        const validator = validatorMap.get(validatorName);
        if (validator) {
          validator.params[paramName] = attr.value;
        }
      }
    }
    
    return {
      enabled: true,
      validators: Array.from(validatorMap.values())
    };
  }

  /**
   * Syncfusion wrapper class names that indicate a component wrapper.
   */
  const SYNCFUSION_WRAPPER_CLASSES$1 = [
    'e-input-group',
    'e-control-wrapper',
    'e-checkbox-wrapper',
    'e-radio-wrapper'
  ];

  /**
   * Determines if an element should be validated.
   * 
   * Checks:
   * 1. data-val="true" must be present
   * 2. Element must be visible (unless data-val-always="true")
   * 3. Element must not be disabled
   * 4. For hidden inputs, checks if Syncfusion wrapper is visible
   * 
   * @param {Element} element - The element to check
   * @returns {boolean} - Whether the element should be validated
   */
  function shouldValidate(element) {
    // Must have data-val="true"
    if (element.getAttribute('data-val') !== 'true') {
      return false;
    }
    
    // Disabled elements are skipped
    if (element instanceof HTMLInputElement && element.disabled) {
      return false;
    }
    if (element instanceof HTMLSelectElement && element.disabled) {
      return false;
    }
    if (element instanceof HTMLTextAreaElement && element.disabled) {
      return false;
    }
    
    // data-val-always="true" overrides visibility checks
    if (element.getAttribute('data-val-always') === 'true') {
      return true;
    }
    
    // Check if element is a hidden input
    if (element instanceof HTMLInputElement && element.type === 'hidden') {
      // For hidden inputs, check if there's a visible Syncfusion wrapper
      return hasSyncfusionVisibleWrapper(element);
    }
    
    // Check visibility
    return isVisible(element);
  }

  /**
   * Check if an element is visible.
   * @param {Element} element
   * @returns {boolean}
   */
  function isVisible(element) {
    if (!(element instanceof HTMLElement)) {
      return true;
    }
    
    // Check computed style
    const style = window.getComputedStyle(element);
    
    if (style.display === 'none') {
      return false;
    }
    
    if (style.visibility === 'hidden') {
      return false;
    }
    
    return true;
  }

  /**
   * Check if a hidden input has a visible Syncfusion wrapper.
   * @param {Element} element
   * @returns {boolean}
   */
  function hasSyncfusionVisibleWrapper(element) {
    // Look for parent with Syncfusion wrapper class
    let parent = element.parentElement;
    
    while (parent) {
      const hasSyncfusionClass = SYNCFUSION_WRAPPER_CLASSES$1.some(cls => 
        parent?.classList.contains(cls)
      );
      
      if (hasSyncfusionClass) {
        return isVisible(parent);
      }
      
      parent = parent.parentElement;
    }
    
    // No Syncfusion wrapper found, hidden input should not validate
    return false;
  }

  /**
   * Find a field element by name within a form, with case-insensitive fallback.
   * 
   * @param {Element | null} container - The form or container element
   * @param {string} fieldName - The field name to search for (e.g., "Employee.FirstName")
   * @returns {Element | null} - The matching field element or null
   */
  function findFieldByName(container, fieldName) {
    if (!container || !fieldName) {
      return null;
    }

    // 1. Try exact match first
    const exactMatch = container.querySelector(`[name="${fieldName}"]`);
    if (exactMatch) {
      return exactMatch;
    }

    // 2. Case-insensitive fallback
    const lowerFieldName = fieldName.toLowerCase();
    const fields = container.querySelectorAll('[name]');
    
    for (const field of fields) {
      const name = field.getAttribute('name');
      if (name && name.toLowerCase() === lowerFieldName) {
        return field;
      }
    }

    return null;
  }

  /**
   * Find a validation message span by data-valmsg-for attribute, with case-insensitive fallback.
   * 
   * @param {Element | null} container - The form or container element
   * @param {string} fieldName - The field name to search for (e.g., "Employee.FirstName")
   * @returns {Element | null} - The matching span element or null
   */
  function findValidationSpan(container, fieldName) {
    if (!container || !fieldName) {
      return null;
    }

    // 1. Try exact match first
    const exactMatch = container.querySelector(`[data-valmsg-for="${fieldName}"]`);
    if (exactMatch) {
      return exactMatch;
    }

    // 2. Case-insensitive fallback
    const lowerFieldName = fieldName.toLowerCase();
    const spans = container.querySelectorAll('[data-valmsg-for]');
    
    for (const span of spans) {
      const valmsgFor = span.getAttribute('data-valmsg-for');
      if (valmsgFor && valmsgFor.toLowerCase() === lowerFieldName) {
        return span;
      }
    }

    return null;
  }

  /**
   * Syncfusion wrapper class names.
   */
  const SYNCFUSION_WRAPPER_CLASSES = [
    'e-input-group',
    'e-control-wrapper',
    'e-checkbox-wrapper'
  ];

  /**
   * Handles displaying and clearing validation errors in the DOM.
   */
  class ErrorDisplay {
    /**
     * Show an error for a field.
     * @param {HTMLFormElement} form
     * @param {string} fieldName
     * @param {string} message
     */
    showError(form, fieldName, message) {
      // Find and update validation span
      const span = findValidationSpan(form, fieldName);
      if (span) {
        span.textContent = message;
        span.classList.remove('field-validation-valid');
        span.classList.add('field-validation-error');
      }
      
      // Find and update input field
      const input = findFieldByName(form, fieldName);
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.classList.remove('input-validation-valid');
        input.classList.add('input-validation-error');
        
        // Handle Syncfusion wrapper
        this.#addSyncfusionErrorClass(input);
      }
    }
    
    /**
     * Clear error for a field.
     * @param {HTMLFormElement} form
     * @param {string} fieldName
     */
    clearError(form, fieldName) {
      // Clear validation span
      const span = findValidationSpan(form, fieldName);
      if (span) {
        span.textContent = '';
        span.classList.remove('field-validation-error');
        span.classList.add('field-validation-valid');
      }
      
      // Clear input field
      const input = findFieldByName(form, fieldName);
      if (input) {
        input.removeAttribute('aria-invalid');
        input.classList.remove('input-validation-error');
        input.classList.add('input-validation-valid');
        
        // Handle Syncfusion wrapper
        this.#removeSyncfusionErrorClass(input);
      }
    }
    
    /**
     * Clear all errors in a form.
     * @param {HTMLFormElement} form
     */
    clearAllErrors(form) {
      // Clear all validation spans
      form.querySelectorAll('[data-valmsg-for]').forEach(span => {
        span.textContent = '';
        span.classList.remove('field-validation-error');
        span.classList.add('field-validation-valid');
      });
      
      // Clear all inputs
      form.querySelectorAll('[aria-invalid="true"]').forEach(input => {
        input.removeAttribute('aria-invalid');
      });
      
      form.querySelectorAll('.input-validation-error').forEach(input => {
        input.classList.remove('input-validation-error');
        input.classList.add('input-validation-valid');
      });
      
      // Clear Syncfusion wrappers
      form.querySelectorAll('.e-error').forEach(wrapper => {
        wrapper.classList.remove('e-error');
      });
    }
    
    /**
     * Add error class to Syncfusion wrapper if present.
     * @param {Element} input
     */
    #addSyncfusionErrorClass(input) {
      const wrapper = this.#findSyncfusionWrapper(input);
      if (wrapper) {
        wrapper.classList.add('e-error');
      }
    }
    
    /**
     * Remove error class from Syncfusion wrapper if present.
     * @param {Element} input
     */
    #removeSyncfusionErrorClass(input) {
      const wrapper = this.#findSyncfusionWrapper(input);
      if (wrapper) {
        wrapper.classList.remove('e-error');
      }
    }
    
    /**
     * Find Syncfusion wrapper for an input.
     * @param {Element} input
     * @returns {Element | null}
     */
    #findSyncfusionWrapper(input) {
      let parent = input.parentElement;
      
      while (parent) {
        const hasWrapperClass = SYNCFUSION_WRAPPER_CLASSES.some(cls => 
          parent?.classList.contains(cls)
        );
        
        if (hasWrapperClass) {
          return parent;
        }
        
        parent = parent.parentElement;
      }
      
      return null;
    }
  }

  /**
   * Default adapter for native HTML form elements.
   * @type {import('./types.js').Adapter}
   */
  const DefaultAdapter = {
    name: 'default',
    
    /**
     * Always returns true - this is the fallback adapter.
     * @param {Element} _element
     * @returns {boolean}
     */
    matches(_element) {
      return true;
    },
    
    /**
     * Gets the value from a form element.
     * @param {Element} element
     * @returns {unknown}
     */
    getValue(element) {
      if (element instanceof HTMLInputElement) {
        if (element.type === 'checkbox') {
          return element.checked;
        }
        if (element.type === 'radio') {
          // For radio, find the checked one in the group
          const form = element.form;
          if (form) {
            const checked = form.querySelector(`input[name="${element.name}"]:checked`);
            return checked ? (/** @type {HTMLInputElement} */ (checked)).value : null;
          }
          return element.checked ? element.value : null;
        }
        return element.value;
      }
      
      if (element instanceof HTMLSelectElement) {
        if (element.multiple) {
          const selected = [];
          for (let i = 0; i < element.options.length; i++) {
            if (element.options[i].selected) {
              selected.push(element.options[i].value);
            }
          }
          return selected;
        }
        return element.value;
      }
      
      if (element instanceof HTMLTextAreaElement) {
        return element.value;
      }
      
      return null;
    },
    
    /**
     * Returns the element itself as the visible element.
     * @param {Element} element
     * @returns {Element}
     */
    getVisibleElement(element) {
      return element;
    },
    
    /**
     * Returns the element itself as the blur target.
     * @param {Element} element
     * @returns {Element}
     */
    getBlurTarget(element) {
      return element;
    }
  };

  /**
   * @typedef {import('./types.js').Adapter} Adapter
   */

  /**
   * Registry for validation adapters.
   * Adapters handle value extraction and visibility for different component types.
   */
  class AdapterRegistry {
    /** @type {Adapter[]} */
    #adapters = [];

    constructor() {
      // DefaultAdapter is always available as fallback
    }

    /**
     * Register an adapter.
     * @param {Adapter} adapter
     */
    register(adapter) {
      this.#adapters.push(adapter);
    }

    /**
     * Check if an adapter is registered by name.
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
      return this.#adapters.some(a => a.name === name);
    }

    /**
     * Get the appropriate adapter for an element.
     * Returns the first matching adapter, or DefaultAdapter if none match.
     * @param {Element} element
     * @returns {Adapter}
     */
    getAdapter(element) {
      for (const adapter of this.#adapters) {
        if (adapter.matches(element)) {
          return adapter;
        }
      }
      return DefaultAdapter;
    }
  }

  /**
   * Syncfusion wrapper class names.
   */
  const WRAPPER_CLASSES = [
    'e-input-group',
    'e-control-wrapper',
    'e-checkbox-wrapper',
    'e-radio-wrapper'
  ];

  /**
   * Adapter for Syncfusion Essential JS 2 components.
   * Syncfusion components render hidden inputs with ej2_instances array.
   * @type {import('./types.js').Adapter}
   */
  const SyncfusionAdapter = {
    name: 'syncfusion',
    
    /**
     * Returns true if element has ej2_instances array.
     * @param {Element} element
     * @returns {boolean}
     */
    matches(element) {
      const instances = /** @type {unknown} */ (element)['ej2_instances'];
      return Array.isArray(instances) && instances.length > 0;
    },
    
    /**
     * Gets the value from Syncfusion component instance.
     * @param {Element} element
     * @returns {unknown}
     */
    getValue(element) {
      const instances = /** @type {unknown} */ (element)['ej2_instances'];
      if (!Array.isArray(instances) || instances.length === 0) {
        return null;
      }
      
      const instance = instances[0];
      
      // CheckBox uses 'checked' property
      if ('checked' in instance) {
        return instance.checked;
      }
      
      // Most components use 'value' property
      if ('value' in instance) {
        return instance.value;
      }
      
      return null;
    },
    
    /**
     * Returns the visible wrapper element for error styling.
     * @param {Element} element
     * @returns {Element}
     */
    getVisibleElement(element) {
      // Look for parent with Syncfusion wrapper class
      let parent = element.parentElement;
      
      while (parent) {
        const hasWrapperClass = WRAPPER_CLASSES.some(cls => 
          parent?.classList.contains(cls)
        );
        
        if (hasWrapperClass) {
          return parent;
        }
        
        parent = parent.parentElement;
      }
      
      return element;
    },
    
    /**
     * Returns the focusable element for blur events.
     * @param {Element} element
     * @returns {Element}
     */
    getBlurTarget(element) {
      // Look for the visible input element within the wrapper
      const wrapper = SyncfusionAdapter.getVisibleElement(element);
      
      // Try common Syncfusion focusable element selectors
      const focusable = wrapper.querySelector('.e-input, .e-checkbox, .e-radio, input:not([type="hidden"])');
      
      return focusable || element;
    }
  };

  const name$9 = 'required';

  /**
   * Required field validator.
   * @param {unknown} value
   * @param {{ message?: string }} params
   * @param {Element} _element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate$9(value, params, _element) {
    const message = params.message || 'This field is required.';
    
    // Null or undefined
    if (value === null || value === undefined) {
      return ValidationResult.invalid(message);
    }
    
    // Boolean false (for checkboxes)
    if (value === false) {
      return ValidationResult.invalid(message);
    }
    
    // String "false" (for checkbox hidden inputs)
    if (value === 'false') {
      return ValidationResult.invalid(message);
    }
    
    // Empty string or whitespace-only
    if (typeof value === 'string' && value.trim() === '') {
      return ValidationResult.invalid(message);
    }
    
    // Empty array
    if (Array.isArray(value) && value.length === 0) {
      return ValidationResult.invalid(message);
    }
    
    return ValidationResult.valid();
  }

  var required = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name$9,
    validate: validate$9
  });

  const name$8 = 'minlength';

  /**
   * Minimum length validator.
   * @param {unknown} value
   * @param {{ min?: string | number; message?: string }} params
   * @param {Element} _element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate$8(value, params, _element) {
    // Empty values pass (use required for mandatory)
    if (value === null || value === undefined || value === '') {
      return ValidationResult.valid();
    }
    
    const min = typeof params.min === 'number' ? params.min : parseInt(String(params.min), 10);
    const message = params.message || `Minimum ${min} characters required.`;
    
    if (typeof value === 'string' && value.length < min) {
      return ValidationResult.invalid(message);
    }
    
    return ValidationResult.valid();
  }

  var minlength = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name$8,
    validate: validate$8
  });

  const name$7 = 'maxlength';

  /**
   * Maximum length validator.
   * @param {unknown} value
   * @param {{ max?: string | number; message?: string }} params
   * @param {Element} _element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate$7(value, params, _element) {
    // Empty values pass
    if (value === null || value === undefined || value === '') {
      return ValidationResult.valid();
    }
    
    const max = typeof params.max === 'number' ? params.max : parseInt(String(params.max), 10);
    const message = params.message || `Maximum ${max} characters allowed.`;
    
    if (typeof value === 'string' && value.length > max) {
      return ValidationResult.invalid(message);
    }
    
    return ValidationResult.valid();
  }

  var maxlength = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name$7,
    validate: validate$7
  });

  const name$6 = 'length';

  /**
   * Length range validator (combined min/max).
   * @param {unknown} value
   * @param {{ min?: string | number; max?: string | number; message?: string }} params
   * @param {Element} _element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate$6(value, params, _element) {
    // Empty values pass
    if (value === null || value === undefined || value === '') {
      return ValidationResult.valid();
    }
    
    const min = typeof params.min === 'number' ? params.min : parseInt(String(params.min), 10);
    const max = typeof params.max === 'number' ? params.max : parseInt(String(params.max), 10);
    const message = params.message || `Length must be between ${min} and ${max}.`;
    
    if (typeof value === 'string') {
      if (value.length < min || value.length > max) {
        return ValidationResult.invalid(message);
      }
    }
    
    return ValidationResult.valid();
  }

  var length = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name$6,
    validate: validate$6
  });

  const name$5 = 'range';

  /**
   * Numeric range validator.
   * @param {unknown} value
   * @param {{ min?: string | number; max?: string | number; message?: string }} params
   * @param {Element} _element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate$5(value, params, _element) {
    // Empty values pass
    if (value === null || value === undefined || value === '') {
      return ValidationResult.valid();
    }
    
    const min = typeof params.min === 'number' ? params.min : parseFloat(String(params.min));
    const max = typeof params.max === 'number' ? params.max : parseFloat(String(params.max));
    const message = params.message || `Value must be between ${min} and ${max}.`;
    
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    
    if (isNaN(numValue) || numValue < min || numValue > max) {
      return ValidationResult.invalid(message);
    }
    
    return ValidationResult.valid();
  }

  var range = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name$5,
    validate: validate$5
  });

  const name$4 = 'regex';

  /**
   * Regular expression pattern validator.
   * @param {unknown} value
   * @param {{ pattern?: string; message?: string }} params
   * @param {Element} _element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate$4(value, params, _element) {
    // Empty values pass
    if (value === null || value === undefined || value === '') {
      return ValidationResult.valid();
    }
    
    const pattern = params.pattern;
    const message = params.message || 'Invalid format.';
    
    if (!pattern) {
      return ValidationResult.valid();
    }
    
    try {
      const regex = new RegExp(pattern);
      if (!regex.test(String(value))) {
        return ValidationResult.invalid(message);
      }
    } catch {
      // Invalid regex pattern - fail validation
      return ValidationResult.invalid(message);
    }
    
    return ValidationResult.valid();
  }

  var regex = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name$4,
    validate: validate$4
  });

  const name$3 = 'email';

  // Simple email regex - matches most common cases
  // Based on HTML5 email input pattern
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Email format validator.
   * @param {unknown} value
   * @param {{ message?: string }} params
   * @param {Element} _element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate$3(value, params, _element) {
    // Empty values pass
    if (value === null || value === undefined || value === '') {
      return ValidationResult.valid();
    }
    
    const message = params.message || 'Invalid email address.';
    
    if (!EMAIL_REGEX.test(String(value))) {
      return ValidationResult.invalid(message);
    }
    
    return ValidationResult.valid();
  }

  var email = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name$3,
    validate: validate$3
  });

  const name$2 = 'number';

  // Matches integers and decimals, including negative
  const NUMBER_REGEX = /^-?\d+(\.\d+)?$/;

  /**
   * Numeric value validator.
   * @param {unknown} value
   * @param {{ message?: string }} params
   * @param {Element} _element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate$2(value, params, _element) {
    // Empty values pass
    if (value === null || value === undefined || value === '') {
      return ValidationResult.valid();
    }
    
    const message = params.message || 'Must be a valid number.';
    const strValue = String(value);
    
    if (!NUMBER_REGEX.test(strValue)) {
      return ValidationResult.invalid(message);
    }
    
    return ValidationResult.valid();
  }

  var number = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name$2,
    validate: validate$2
  });

  const name$1 = 'equalto';

  /**
   * Field comparison validator.
   * @param {unknown} value
   * @param {{ other?: string; message?: string }} params
   * @param {Element} element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate$1(value, params, element) {
    // Empty values pass
    if (value === null || value === undefined || value === '') {
      return ValidationResult.valid();
    }
    
    const message = params.message || 'Values must match.';
    let otherFieldName = params.other;
    
    if (!otherFieldName) {
      return ValidationResult.valid();
    }
    
    // Handle ASP.NET Core *.FieldName format
    if (otherFieldName.startsWith('*.')) {
      otherFieldName = otherFieldName.substring(2);
    }
    
    // Find the other field in the same form
    const form = element.closest('form');
    if (!form) {
      return ValidationResult.valid();
    }
    
    const otherField = form.querySelector(`[name="${otherFieldName}"]`);
    if (!otherField) {
      return ValidationResult.valid();
    }
    
    const otherValue = otherField instanceof HTMLInputElement 
      ? otherField.value 
      : otherField instanceof HTMLSelectElement 
      ? otherField.value 
      : otherField instanceof HTMLTextAreaElement 
      ? otherField.value 
      : null;
    
    if (String(value) !== String(otherValue)) {
      return ValidationResult.invalid(message);
    }
    
    return ValidationResult.valid();
  }

  var equalto = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name$1,
    validate: validate$1
  });

  const name = 'url';

  /**
   * URL format validator.
   * @param {unknown} value
   * @param {{ message?: string }} params
   * @param {Element} _element
   * @returns {import('../ValidationResult.js').ValidationResult}
   */
  function validate(value, params, _element) {
    // Empty values pass
    if (value === null || value === undefined || value === '') {
      return ValidationResult.valid();
    }
    
    const message = params.message || 'Invalid URL.';
    
    try {
      new URL(String(value));
      return ValidationResult.valid();
    } catch {
      return ValidationResult.invalid(message);
    }
  }

  var url = /*#__PURE__*/Object.freeze({
    __proto__: null,
    name: name,
    validate: validate
  });

  /**
   * All built-in validators.
   */
  const validators = [
    required,
    minlength,
    maxlength,
    length,
    range,
    regex,
    email,
    number,
    equalto,
    url
  ];

  /**
   * @typedef {Object} ValidateOptions
   * @property {boolean} [showErrors] - Whether to display errors in the DOM
   * @property {boolean} [stopOnFirst] - Stop on first error (default: true)
   */

  /**
   * Core validation engine.
   * Orchestrates validators, adapters, and error display.
   */
  class ValidationEngine {
    /** @type {ValidatorRegistry} */
    #validators = new ValidatorRegistry();
    
    /** @type {AdapterRegistry} */
    #adapters = new AdapterRegistry();
    
    /** @type {ErrorDisplay} */
    #display = new ErrorDisplay();

    constructor() {
      // Register built-in validators
      for (const validator of validators) {
        this.#validators.register(validator.name, validator.validate);
      }
      
      // Register Syncfusion adapter
      this.#adapters.register(SyncfusionAdapter);
    }

    /**
     * Validate a single field.
     * @param {Element} field
     * @param {ValidateOptions} [options]
     * @returns {import('./ValidationResult.js').ValidationResult}
     */
    validateField(field, options = {}) {
      const { showErrors = false, stopOnFirst = true } = options;
      const fieldName = field.getAttribute('name') || '';
      const form = field.closest('form');
      
      // Parse validation attributes
      const parsed = parseValidationAttributes(field);
      
      if (!parsed.enabled) {
        return ValidationResult.valid();
      }
      
      // Get value using adapter
      const adapter = this.#adapters.getAdapter(field);
      const value = adapter.getValue(field);
      
      // Run validators
      for (const validatorConfig of parsed.validators) {
        const validator = this.#validators.get(validatorConfig.name);
        
        if (!validator) {
          continue;
        }
        
        const result = validator(value, { message: validatorConfig.message, ...validatorConfig.params }, field);
        
        if (!result.isValid) {
          if (showErrors && form) {
            this.#display.showError(form, fieldName, result.message || '');
          }
          
          if (stopOnFirst) {
            return result;
          }
        }
      }
      
      // Field is valid - clear any existing errors
      if (showErrors && form) {
        this.#display.clearError(form, fieldName);
      }
      
      return ValidationResult.valid();
    }

    /**
     * Validate all fields in a form.
     * @param {HTMLFormElement} form
     * @param {ValidateOptions} [options]
     * @returns {import('./ValidationResult.js').CombinedValidationResult}
     */
    validateForm(form, options = {}) {
      const { showErrors = false } = options;
      
      // Find all validatable fields
      const fields = form.querySelectorAll('[data-val="true"]');
      
      /** @type {import('./ValidationResult.js').ValidationResult[]} */
      const results = [];
      
      for (const field of fields) {
        // Skip fields that shouldn't be validated
        if (!shouldValidate(field)) {
          continue;
        }
        
        const result = this.validateField(field, { ...options, showErrors });
        results.push(result);
      }
      
      return ValidationResult.combine(results);
    }

    /**
     * Register a custom validator.
     * @param {string} name
     * @param {import('./ValidatorRegistry.js').ValidatorFn} validator
     */
    registerValidator(name, validator) {
      this.#validators.register(name, validator, { override: true });
    }

    /**
     * Clear all errors in a form.
     * @param {HTMLFormElement} form
     */
    clearErrors(form) {
      this.#display.clearAllErrors(form);
    }
  }

  /**
   * @typedef {Object} FieldTriggersOptions
   * @property {number} [debounceMs] - Debounce delay for input events (default: 0)
   */

  /**
   * Manages validation triggers for form fields.
   * Implements "angry on blur, forgiving on input" pattern.
   */
  class FieldTriggers {
    /** @type {(field: Element) => void} */
    #onValidate;
    
    /** @type {WeakSet<Element>} */
    #touched = new WeakSet();
    
    /** @type {WeakSet<Element>} */
    #invalid = new WeakSet();
    
    /** @type {Map<HTMLFormElement, { blur: (e: Event) => void; input: (e: Event) => void }>} */
    #listeners = new Map();
    
    /** @type {Map<Element, ReturnType<typeof setTimeout>>} */
    #debounceTimers = new Map();
    
    /** @type {number} */
    #debounceMs;

    /**
     * @param {(field: Element) => void} onValidate - Callback when field should be validated
     * @param {FieldTriggersOptions} [options]
     */
    constructor(onValidate, options = {}) {
      this.#onValidate = onValidate;
      this.#debounceMs = options.debounceMs ?? 0;
    }

    /**
     * Attach event listeners to a form.
     * @param {HTMLFormElement} form
     */
    attach(form) {
      if (this.#listeners.has(form)) {
        return;
      }
      
      const blurHandler = (e) => this.#handleBlur(e);
      const inputHandler = (e) => this.#handleInput(e);
      
      form.addEventListener('blur', blurHandler, true);
      form.addEventListener('input', inputHandler, true);
      
      this.#listeners.set(form, { blur: blurHandler, input: inputHandler });
    }

    /**
     * Detach event listeners from a form.
     * @param {HTMLFormElement} form
     */
    detach(form) {
      const handlers = this.#listeners.get(form);
      if (!handlers) {
        return;
      }
      
      form.removeEventListener('blur', handlers.blur, true);
      form.removeEventListener('input', handlers.input, true);
      
      this.#listeners.delete(form);
    }

    /**
     * Check if a field has been touched (blurred at least once).
     * @param {Element} field
     * @returns {boolean}
     */
    isTouched(field) {
      return this.#touched.has(field);
    }

    /**
     * Check if a field is currently marked as invalid.
     * @param {Element} field
     * @returns {boolean}
     */
    isInvalid(field) {
      return this.#invalid.has(field);
    }

    /**
     * Mark a field as invalid.
     * @param {Element} field
     */
    markAsInvalid(field) {
      this.#invalid.add(field);
    }

    /**
     * Mark a field as valid.
     * @param {Element} field
     */
    markAsValid(field) {
      this.#invalid.delete(field);
    }

    /**
     * Reset all state.
     */
    reset() {
      this.#touched = new WeakSet();
      this.#invalid = new WeakSet();
      
      // Clear all debounce timers
      for (const timer of this.#debounceTimers.values()) {
        clearTimeout(timer);
      }
      this.#debounceTimers.clear();
    }

    /**
     * Handle blur event - validate on first touch.
     * @param {Event} e
     */
    #handleBlur(e) {
      const field = e.target;
      if (!(field instanceof Element)) {
        return;
      }
      
      if (!this.#shouldValidate(field)) {
        return;
      }
      
      this.#touched.add(field);
      this.#onValidate(field);
    }

    /**
     * Handle input event - re-validate if field has error.
     * @param {Event} e
     */
    #handleInput(e) {
      const field = e.target;
      if (!(field instanceof Element)) {
        return;
      }
      
      if (!this.#shouldValidate(field)) {
        return;
      }
      
      // Only re-validate if field has error (forgiving on input)
      if (!this.#invalid.has(field)) {
        return;
      }
      
      // Debounce if configured
      if (this.#debounceMs > 0) {
        const existing = this.#debounceTimers.get(field);
        if (existing) {
          clearTimeout(existing);
        }
        
        const timer = setTimeout(() => {
          this.#debounceTimers.delete(field);
          this.#onValidate(field);
        }, this.#debounceMs);
        
        this.#debounceTimers.set(field, timer);
      } else {
        this.#onValidate(field);
      }
    }

    /**
     * Check if a field should be validated.
     * @param {Element} field
     * @returns {boolean}
     */
    #shouldValidate(field) {
      return field.getAttribute('data-val') === 'true';
    }
  }

  // Singleton engine instance for the default pipeline
  const engine = new ValidationEngine();

  /** @type {WeakMap<HTMLFormElement, FieldTriggers>} */
  const formTriggers = new WeakMap();

  /**
   * Lazily set up field triggers for a form.
   * This enables "angry on blur, forgiving on input" validation.
   * @param {HTMLFormElement} form
   */
  function ensureFieldTriggers(form) {
    if (formTriggers.has(form)) {
      return formTriggers.get(form);
    }
    
    const triggers = new FieldTriggers((field) => {
      // Validate the field and show/clear errors
      const result = engine.validateField(field, { showErrors: true });
      
      // Track invalid state for "forgiving on input"
      if (result.isValid) {
        triggers.markAsValid(field);
      } else {
        triggers.markAsInvalid(field);
      }
    }, { debounceMs: 150 });
    
    triggers.attach(form);
    formTriggers.set(form, triggers);
    
    return triggers;
  }

  /**
   * Client-side validation pipeline step.
   * 
   * When data-alis-validate="true" is present on a form,
   * this step will validate all fields before the request is sent.
   * If validation fails, ctx.error is set and the pipeline will stop.
   * 
   * @param {import('../context.js').PipelineContext} ctx
   * @returns {import('../context.js').PipelineContext}
   */
  function clientValidationStep(ctx) {
    const element = ctx.element;
    
    // Only validate form elements
    if (!(element instanceof HTMLFormElement)) {
      return ctx;
    }
    
    // Check if validation is enabled
    const validateAttr = element.getAttribute('data-alis-validate');
    if (validateAttr !== 'true') {
      return ctx;
    }
    
    // Lazily set up field triggers for blur/input validation
    const triggers = ensureFieldTriggers(element);
    
    // Run validation and track invalid fields
    const fields = element.querySelectorAll('[data-val="true"]');
    const invalidFieldsList = [];
    
    for (const field of fields) {
      const result = engine.validateField(field, { showErrors: true });
      if (!result.isValid) {
        triggers.markAsInvalid(field);
        invalidFieldsList.push(field);
      } else {
        triggers.markAsValid(field);
      }
    }
    
    if (invalidFieldsList.length > 0) {
      // Collect error messages
      const messages = invalidFieldsList
        .map(f => f.getAttribute('name') || 'field')
        .join(', ');
      
      // Set error to prevent the request from being sent
      // Do NOT set ctx.state.aborted so cleanup steps still run
      ctx.error = new ALISError(
        'Validation failed for: ' + messages,
        'VALIDATION_ERROR'
      );
    }
    
    return ctx;
  }

  /**
   * @param {Element} element
   * @returns {{ method: string; url: string }}
   */
  function getMethodAndUrl(element) {
    if (!element) {
      throw new TypeError('getMethodAndUrl: element is required');
    }

    // First, check for data-alis-{method} attributes (works for all elements including forms)
    for (const method of METHODS) {
      const attr = element.getAttribute(`data-alis-${method}`);
      if (attr) {
        return { method, url: attr };
      }
    }

    // For forms, fall back to action/method attributes
    if (element instanceof HTMLFormElement) {
      const method = (element.getAttribute('method') || 'get').toLowerCase();
      const action = element.getAttribute('action');
      if (!action) {
        throw new Error('Form requires an action attribute or data-alis-{method} attribute for ALIS');
      }
      return { method, url: action };
    }

    throw new Error('No ALIS method attribute found');
  }

  /**
   * @param {Element} element
   * @returns {Record<string, string>}
   */
  function getAllAttributes(element) {
    if (!element) {
      return {};
    }
    /** @type {Record<string, string>} */
    const collected = {};
    Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-alis-'))
      .forEach(attr => {
        const key = attr.name.replace('data-alis-', '');
        collected[key] = attr.value;
      });
    return collected;
  }

  /**
   * @template T
   * @param {{ name?: string; allowOverride?: boolean }} [options]
   */
  function createRegistry({ name = 'registry', allowOverride = false } = {}) {
    /** @type {Map<string, T>} */
    const store = new Map();

    /**
     * @param {string} key
     */
    function assertKey(key) {
      if (typeof key !== 'string' || key.trim() === '') {
        throw new TypeError(`${name}: key must be a non-empty string`);
      }
    }

    /**
     * @param {string} key
     * @param {T} value
     * @param {{ override?: boolean }} [options]
     */
    function register(key, value, options = {}) {
      assertKey(key);
      if (value == null) {
        throw new TypeError(`${name}: value is required for "${key}"`);
      }

      const exists = store.has(key);
      const canOverride = allowOverride || Boolean(options.override);
      if (exists && !canOverride) {
        throw new Error(`${name}: "${key}" already registered`);
      }

      store.set(key, value);
      return value;
    }

    /**
     * @param {string} key
     */
    function get(key) {
      assertKey(key);
      return store.get(key);
    }

    /**
     * @param {string} key
     */
    function has(key) {
      assertKey(key);
      return store.has(key);
    }

    /**
     * @param {string} key
     */
    function unregister(key) {
      assertKey(key);
      return store.delete(key);
    }

    function clear() {
      store.clear();
    }

    function keys() {
      return Array.from(store.keys());
    }

    function entries() {
      return Array.from(store.entries());
    }

    return Object.freeze({
      register,
      get,
      has,
      unregister,
      clear,
      keys,
      entries
    });
  }

  /**
   * @param {Record<string, unknown> | undefined} data
   */
  function serialize$2(data) {
    return {
      body: data ? JSON.stringify(data) : undefined,
      contentType: 'application/json'
    };
  }

  /**
   * @param {Record<string, any> | undefined} data
   */
  function serialize$1(data) {
    const formData = new FormData();

    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File || value instanceof Blob) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach(item => formData.append(key, item));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }

    return {
      body: formData,
      contentType: null
    };
  }

  /**
   * @param {Record<string, any> | undefined} data
   */
  function serialize(data) {
    const params = new URLSearchParams();

    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }

        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, String(item)));
        } else {
          params.append(key, String(value));
        }
      });
    }

    return {
      body: params.toString(),
      contentType: 'application/x-www-form-urlencoded'
    };
  }

  const registry$3 = createRegistry({ name: 'ALIS.serialize', allowOverride: true });

  registry$3.register('json', serialize$2);
  registry$3.register('formdata', serialize$1);
  registry$3.register('urlencoded', serialize);

  function getSerializer(name = 'json') {
    const serializer = registry$3.get(name);
    if (!serializer) {
      throw new Error(`Unknown serializer "${name}"`);
    }
    return serializer;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function requestBuildStep(ctx) {
    // Skip if there's already an error (e.g., from validation)
    if (ctx.error) {
      return ctx;
    }
    
    const methodAndUrl = ctx.config.url
      ? { method: ctx.config.method, url: ctx.config.url }
      : ctx.element
      ? getMethodAndUrl(ctx.element)
      : null;

    const resolvedMethod = toMethod(methodAndUrl?.method) || toMethod(ctx.config.method) || 'GET';
    const method = resolvedMethod.toUpperCase();
    const url = typeof methodAndUrl?.url === 'string' ? methodAndUrl.url : typeof ctx.config.url === 'string' ? ctx.config.url : undefined;

    if (!url) {
      throw new Error('requestBuildStep: URL is required');
    }

    /** @type {Record<string, string>} */
    const headers = { ...(ctx.config.headers || {}) };
    let body;
    let finalUrl = url;

    const data = ctx.collect?.data;
    if (data && typeof data === 'object') {
      const payload = /** @type {Record<string, unknown>} */ (data);
      if (method === 'GET') {
        const query = buildQueryString(payload);
        if (query) {
          finalUrl = appendQuery(finalUrl, query);
        }
      } else {
        // Form elements default to FormData (matches jQuery Unobtrusive, works with ASP.NET model binding)
        // Non-form elements default to JSON (API-style requests)
        const isFormElement = ctx.element instanceof HTMLFormElement;
        const defaultSerializer = isFormElement ? 'formdata' : 'json';
        const serializerName = typeof ctx.config.serialize === 'string' ? ctx.config.serialize : defaultSerializer;
        const serializer = getSerializer(serializerName);
        const serialized = serializer(payload);
        body = serialized.body;
        if (serialized.contentType && !headers['Content-Type']) {
          headers['Content-Type'] = serialized.contentType;
        }
      }
    }

    ctx.request = {
      url: finalUrl,
      method,
      headers,
      body
    };

    return ctx;
  }

  /**
   * @param {Record<string, unknown>} data
   */
  function buildQueryString(data) {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value == null) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, String(item)));
      } else if (isLegacyField(value)) {
        params.append(value.name, String(value.value));
      } else {
        params.append(key, String(value));
      }
    });
    return params.toString();
  }

  /**
   * @param {string} url
   * @param {string} query
   */
  function appendQuery(url, query) {
    if (!query) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${query}`;
  }

  /**
   * @param {unknown} value
   */
  function toMethod(value) {
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * @param {unknown} value
   * @returns {value is { name: string; value: unknown }}
   */
  function isLegacyField(value) {
    return Boolean(
      value &&
      typeof value === 'object' &&
      'name' in value &&
      'value' in value
    );
  }

  /**
   * @param {() => Promise<Response>} operation
   * @param {import('../pipeline/context.js').PipelineContext} ctx
   * @param {{ maxAttempts?: number; statusCodes?: number[]; calculateDelay?: (attempt: number, policy: any) => number }} policy
   */
  async function executeWithRetry(operation, ctx, policy) {
    const maxAttempts = policy.maxAttempts ?? 1;
    const retryStatuses = policy.statusCodes ?? [];

    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      ctx.state.attempts = attempt;
      try {
        const response = await operation();
        // If status is not retryable, return immediately (success or non-retryable error)
        if (!retryStatuses.includes(response.status)) {
          return response;
        }
        // If this is the last attempt and we got a retryable status, throw
        if (attempt === maxAttempts) {
          throw new Error(`Request failed with status ${response.status} after ${maxAttempts} attempts`);
        }
        lastError = new Error(`Retryable status ${response.status}`);
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) {
          break;
        }
      }

      const delay = policy.calculateDelay ? policy.calculateDelay(attempt, policy) : 0;
      if (delay > 0) {
        await wait(delay);
      }
    }

    throw lastError || new Error('Retry attempts exhausted');
  }

  /**
   * @param {number} ms
   */
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @param {number} attempt
   * @param {{ baseDelay: number; maxDelay: number; jitter?: number }} options
   */
  function calculateDelay(attempt, { baseDelay, maxDelay, jitter = 0 }) {
    const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
    return applyJitter(delay, jitter);
  }

  /**
   * @param {number} delay
   * @param {number} jitter
   */
  function applyJitter(delay, jitter) {
    if (!jitter) {
      return delay;
    }
    const spread = delay * jitter;
    const min = delay - spread;
    const max = delay + spread;
    return Math.round(Math.random() * (max - min) + min);
  }

  const registry$2 = createRegistry({ name: 'ALIS.retry', allowOverride: true });

  registry$2.register('default', {
    maxAttempts: 3,
    statusCodes: [408, 429, 500, 502, 503, 504],
    baseDelay: 1_000,
    maxDelay: 30_000,
    jitter: 0.2,
    calculateDelay
  });

  function getRetryPolicy(name = 'default') {
    const policy = registry$2.get(name);
    if (!policy) {
      throw new Error(`Unknown retry policy "${name}"`);
    }
    return policy;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  async function requestExecuteStep(ctx) {
    // Skip if there's already an error (e.g., from validation)
    if (ctx.error) {
      return ctx;
    }
    
    if (!ctx.request) {
      throw new Error('requestExecuteStep: request not built');
    }

    const request = ctx.request;
    const fetchOptions = {
      method: request.method,
      headers: request.headers,
      body: request.body,
      credentials: /** @type {RequestCredentials} */ (ctx.config.credentials ?? 'same-origin'),
      signal: ctx.abortController?.signal
    };

    const requestFn = () => fetch(request.url, fetchOptions);
    ctx.state.startTime = ctx.state.startTime ?? Date.now();

    const retryPolicy = resolveRetryPolicy(ctx.config.retry);
    let response;

    if (retryPolicy) {
      response = await executeWithRetry(requestFn, ctx, retryPolicy);
    } else {
      ctx.state.attempts = 1;
      response = await requestFn();
    }

    ctx.response = response;
    ctx.state.endTime = Date.now();
    ctx.state.duration = ctx.state.endTime - (ctx.state.startTime || ctx.state.endTime);

    return ctx;
  }

  /**
   * @param {unknown} retryConfig
   */
  function resolveRetryPolicy(retryConfig) {
    if (retryConfig === false) {
      return null;
    }
    if (typeof retryConfig === 'string') {
      return getRetryPolicy(retryConfig);
    }
    if (retryConfig && typeof retryConfig === 'object') {
      return {
        ...getRetryPolicy('default'),
        ...retryConfig
      };
    }
    return getRetryPolicy('default');
  }

  /**
   * @param {unknown} value
   * @returns {value is { title?: string; detail?: string; errors?: Record<string, string[] | string> }}
   */
  function isProblemDetails(value) {
    return Boolean(
      value &&
      typeof value === 'object' &&
      ('title' in value || 'detail' in value || 'errors' in value)
    );
  }

  /**
   * @param {unknown} payload
   */
  function parseProblemDetails(payload) {
    if (!isProblemDetails(payload)) {
      return null;
    }

    /** @type {Record<string, string[]>} */
    const errors = {};
    if (payload.errors && typeof payload.errors === 'object') {
      Object.entries(payload.errors).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          errors[key] = value.map(String);
        } else if (value != null) {
          errors[key] = [String(value)];
        }
      });
    }

    return {
      title: payload.title || 'Validation error',
      detail: payload.detail || '',
      errors
    };
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  async function responseParseStep(ctx) {
    // Skip if there's already an error (e.g., from validation) or no response
    if (ctx.error || !ctx.response) {
      return ctx;
    }

    const contentType = ctx.response.headers.get('content-type') || '';
    const clone = ctx.response.clone();

    if (contentType.includes('json')) {
      ctx.body = await clone.json();
      if (isProblemDetails(ctx.body)) {
        ctx.validation = parseProblemDetails(ctx.body);
      }
    } else if (contentType.includes('text/')) {
      ctx.body = await clone.text();
    } else {
      ctx.body = await clone.arrayBuffer();
    }

    return ctx;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function responseRouteStep(ctx) {
    // Skip if there's already an error (e.g., from validation) or no response
    if (ctx.error || !ctx.response) {
      ctx.success = false;
      return ctx;
    }

    const status = ctx.response.status;
    if (status >= 200 && status < 300) {
      ctx.success = true;
      emit('response:route', { id: ctx.id, status: 'success' });
      return ctx;
    }

    // Set ctx.error for non-2xx responses so hooks can check ctx.error consistently
    if (ctx.validation) {
      // Server-side validation error (400 with ProblemDetails)
      ctx.error = new ALISError(
        ctx.validation.title || 'Validation failed',
        'SERVER_VALIDATION_ERROR'
      );
      emit('response:route', { id: ctx.id, status: 'validation-error' });
    } else {
      // Other HTTP errors (4xx, 5xx)
      ctx.error = new ALISError(
        `HTTP ${status}: ${ctx.response.statusText || 'Request failed'}`,
        'HTTP_ERROR'
      );
      emit('response:route', { id: ctx.id, status: 'error' });
    }

    ctx.success = false;
    return ctx;
  }

  /**
   * @param {HTMLFormElement} form
   */
  function clearErrors(form) {
    // Clear validation message spans
    form.querySelectorAll('[data-valmsg-for]').forEach(node => {
      node.textContent = '';
      node.classList.remove('field-validation-error');
      node.classList.add('field-validation-valid');
    });
    
    // Clear input error states
    form.querySelectorAll('[aria-invalid="true"]').forEach(field => {
      field.removeAttribute('aria-invalid');
    });
    
    // Clear input error classes
    form.querySelectorAll('.input-validation-error').forEach(field => {
      field.classList.remove('input-validation-error');
      field.classList.add('input-validation-valid');
    });
  }

  /**
   * @param {HTMLFormElement} form
   * @param {{ errors?: Record<string, string[]> }} details
   */
  function displayErrors(form, details) {
    if (!details?.errors) {
      return;
    }

    Object.entries(details.errors).forEach(([field, messages]) => {
      // Find validation span (with case-insensitive fallback)
      const target = findValidationSpan(form, field);
      if (target) {
        target.textContent = messages.join(', ');
        target.classList.remove('field-validation-valid');
        target.classList.add('field-validation-error');
      }
      
      // Find input field (with case-insensitive fallback)
      const input = findFieldByName(form, field);
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.classList.remove('input-validation-valid');
        input.classList.add('input-validation-error');
      }
    });
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function validationDisplayStep(ctx) {
    const form = resolveForm(ctx.element);
    if (!form) {
      return ctx;
    }

    // Don't clear errors if client-side validation failed
    // (those errors are already displayed by clientValidationStep)
    const isClientValidationError = ctx.error instanceof ALISError && ctx.error.code === 'VALIDATION_ERROR';
    if (isClientValidationError) {
      return ctx;
    }

    clearErrors(form);
    if (ctx.validation) {
      displayErrors(form, ctx.validation);
    }
    return ctx;
  }

  /**
   * @param {Element | null} element
   */
  function resolveForm(element) {
    if (!element) {
      return null;
    }
    if (element instanceof HTMLFormElement) {
      return element;
    }
    return element.closest('form');
  }

  /**
   * @param {Element} target
   * @param {string} content
   */
  function swap$2(target, content) {
    target.innerHTML = content;
    return target;
  }

  /**
   * @param {Element} target
   * @param {string} content
   */
  function swap$1(target, content) {
    const doc = target.ownerDocument;
    const template = doc.createElement('template');
    template.innerHTML = content.trim();

    const replacement = template.content.firstElementChild;
    if (!replacement) {
      target.outerHTML = content;
      return target.nextElementSibling || target;
    }

    const node = replacement.cloneNode(true);
    target.replaceWith(node);
    return /** @type {Element} */ (node);
  }

  /**
   * @param {Element} target
   */
  function swap(target) {
    return target;
  }

  const registry$1 = createRegistry({ name: 'ALIS.swap', allowOverride: true });

  registry$1.register('innerHTML', swap$2);
  registry$1.register('outerHTML', swap$1);
  registry$1.register('none', swap);

  function getSwapStrategy(name = 'innerHTML') {
    const swapper = registry$1.get(name);
    if (!swapper) {
      throw new Error(`Unknown swap strategy "${name}"`);
    }
    return swapper;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function swapStep(ctx) {
    if (typeof ctx.config.target !== 'string' || ctx.body == null) {
      return ctx;
    }

    const selector = ctx.config.target.startsWith('#') ? ctx.config.target : `#${ctx.config.target}`;
    const target = document.querySelector(selector);
    if (!target) {
      return ctx;
    }

    // Capture focus state BEFORE swap (for elements OUTSIDE the target)
    const activeElement = document.activeElement;
    const shouldPreserveFocus = activeElement && 
      activeElement !== document.body && 
      !target.contains(activeElement);
    
    // Get cursor position for text inputs
    let selectionStart = null;
    let selectionEnd = null;
    if (shouldPreserveFocus && (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
      try {
        selectionStart = activeElement.selectionStart;
        selectionEnd = activeElement.selectionEnd;
      } catch {
        // Some input types don't support selection
      }
    }

    const strategyName = typeof ctx.config.swap === 'string' ? ctx.config.swap : 'innerHTML';
    const strategy = getSwapStrategy(strategyName);
    strategy(target, typeof ctx.body === 'string' ? ctx.body : JSON.stringify(ctx.body));

    // Preserve focus for elements OUTSIDE the swap target (e.g., search input)
    // This prevents focus loss when updating a results container
    if (shouldPreserveFocus && activeElement instanceof HTMLElement) {
      if (document.body.contains(activeElement)) {
        activeElement.focus();
        // Restore cursor position for text inputs
        if ((activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) && 
            selectionStart !== null && selectionEnd !== null) {
          try {
            activeElement.setSelectionRange(selectionStart, selectionEnd);
          } catch {
            // Some input types don't support setSelectionRange
          }
        }
      }
    }

    // Note: Final focus to trigger element is handled by focusStep

    return ctx;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  function stateRestoreStep(ctx) {
    ctx.stateManager?.restore();
    return ctx;
  }

  /**
   * @param {import('../context.js').PipelineContext} ctx
   */
  async function hooksAfterStep(ctx) {
    if (!ctx.config.onAfter) {
      return ctx;
    }

    emit('hooks:after:start', { id: ctx.id });

    const handlers = Array.isArray(ctx.config.onAfter)
      ? ctx.config.onAfter
      : [ctx.config.onAfter];

    for (const handler of handlers) {
      if (typeof handler === 'function') {
        // eslint-disable-next-line no-await-in-loop
        await handler(ctx);
      }
    }

    emit('hooks:after:complete', { id: ctx.id });
    return ctx;
  }

  /**
   * Focus restoration step - runs as the final step in the pipeline.
   * 
   * Focus priority:
   * 1. If config.focus is specified, focus that element
   * 2. If trigger element is focusable and still in DOM, focus it
   * 3. Otherwise, don't change focus
   * 
   * @param {import('../context.js').PipelineContext} ctx
   */
  function focusStep(ctx) {
    // Skip if there was an error (let error handling deal with focus)
    if (ctx.error) {
      return ctx;
    }

    // Check for explicit focus target in config
    const focusTarget = ctx.config?.focus;
    if (focusTarget) {
      const targetElement = typeof focusTarget === 'string' 
        ? document.querySelector(focusTarget)
        : focusTarget;
      
      if (targetElement instanceof HTMLElement && isFocusable(targetElement)) {
        targetElement.focus();
        return ctx;
      }
    }

    // Default: focus the trigger element if it's focusable
    const element = ctx.element;
    if (element instanceof HTMLElement && isFocusable(element) && document.body.contains(element)) {
      // Only focus if the element doesn't already have focus
      if (document.activeElement !== element) {
        element.focus();
      }
    }

    return ctx;
  }

  /**
   * Check if an element is focusable
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  function isFocusable(element) {
    // Element must be visible
    if (element.offsetParent === null && element.style.position !== 'fixed') {
      return false;
    }

    // Check if disabled
    if ('disabled' in element && element.disabled) {
      return false;
    }

    // Check tabindex
    const tabindex = element.getAttribute('tabindex');
    if (tabindex !== null && parseInt(tabindex, 10) < 0) {
      return false;
    }

    // Natively focusable elements
    const focusableTags = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'];
    if (focusableTags.includes(element.tagName)) {
      // Anchor needs href to be focusable
      if (element.tagName === 'A' && !element.hasAttribute('href')) {
        return tabindex !== null;
      }
      return true;
    }

    // Elements with tabindex >= 0 are focusable
    if (tabindex !== null && parseInt(tabindex, 10) >= 0) {
      return true;
    }

    // contenteditable elements are focusable
    if (element.isContentEditable) {
      return true;
    }

    return false;
  }

  const DEFAULT_STEPS = [
    validateStep,
    confirmStep,
    coordinateStep,
    collectStep,         // Collect BEFORE state changes (element might get disabled)
    stateCaptureStep,
    stateApplyStep,
    hooksBeforeStep,
    clientValidationStep, // Client-side validation after hooks-before, before request
    requestBuildStep,
    requestExecuteStep,
    responseParseStep,
    responseRouteStep,
    validationDisplayStep,
    swapStep,
    stateRestoreStep,
    hooksAfterStep,
    focusStep,           // Focus restoration as final user-facing step
    coordinateCleanupStep
  ];

  /**
   * @param {import('../pipeline/context.js').PipelineContext} ctx
   */
  async function runDefaultPipeline(ctx) {
    const result = await runPipeline(ctx, DEFAULT_STEPS);
    // Re-throw if there was an error so callers can catch it
    if (result.error) {
      throw result.error;
    }
    return result;
  }

  const registry = createRegistry({ name: 'ALIS.confirm', allowOverride: true });

  /**
   * @param {string} name
   * @param {(ctx: import('../pipeline/context.js').PipelineContext) => Promise<boolean> | boolean} handler
   */
  function registerConfirm(name, handler) {
    return registry.register(name, handler, { override: true });
  }

  /**
   * @param {string} name
   * @param {import('../pipeline/context.js').PipelineContext} ctx
   */
  async function executeConfirm(name, ctx) {
    const handler = registry.get(name);
    if (!handler) {
      throw new Error(`Confirm handler "${name}" not found`);
    }
    return handler(ctx);
  }

  /**
   * @param {string | Element} selectorOrElement
   * @param {import('../pipeline/context.js').PipelineContext} ctx
   */
  async function executeElementConfirm(selectorOrElement, ctx) {
    const element = typeof selectorOrElement === 'string' ? resolveElement(selectorOrElement) : selectorOrElement;
    if (!element) {
      throw new Error('executeElementConfirm: element not found');
    }

    const confirmName = element.getAttribute('data-alis-confirm');
    if (confirmName) {
      return executeConfirm(confirmName, ctx);
    }

    const message = element.getAttribute('data-alis-confirm-message') || 'Are you sure?';
    if (typeof window.confirm === 'function') {
      return window.confirm(message);
    }
    return true;
  }

  /**
   * @typedef {Record<string, unknown> & { data?: unknown }} OverrideConfig
   */

  /**
   * @param {Element} element
   * @param {OverrideConfig} overrides
   * @param {Record<string, unknown>} globalConfig
   */
  function createContextForElement(element, overrides = {}, globalConfig = {}) {
    const attrConfig = buildConfigFromAttributes(element);
    const mergedConfig = {
      ...globalConfig,
      ...attrConfig,
      ...overrides
    };

    const ctx = createContext(element, { config: mergedConfig });
    const data = extractData(overrides);
    if (data !== undefined) {
      ctx.collect = { source: element, data };
    }
    return ctx;
  }

  /**
   * @param {Element} element
   */
  function buildConfigFromAttributes(element) {
    if (!element) return {};
    const attrs = getAllAttributes(element);
    const config = /** @type {Record<string, unknown>} */ ({});
    
    // Extract URL and method from element (form action/method or data-alis-{method})
    try {
      const { method, url } = getMethodAndUrl(element);
      config.method = method;
      config.url = url;
    } catch {
      // Element might not have method/url attributes yet (will be validated later)
    }
    
    if (attrs.target) config.target = attrs.target;
    if (attrs.collect) config.collect = attrs.collect;
    if (attrs.indicator) config.indicator = attrs.indicator;
    if (attrs.swap) config.swap = attrs.swap;
    if (attrs.serialize) config.serialize = attrs.serialize;
    if (attrs.encoding) config.encoding = attrs.encoding;
    const concurrencyAttr = attrs.concurrency || attrs['duplicate-request'];
    if (concurrencyAttr) {
      config.duplicateRequest = concurrencyAttr;
    }
    if (attrs.retry) config.retry = parseRetry(attrs.retry);
    if (attrs.confirm) {
      const confirmHandler =
        /** @type {(ctx: import('../pipeline/context.js').PipelineContext) => Promise<boolean> | boolean} */ (
          ctx => executeConfirm(attrs.confirm, ctx)
        );
      config.confirm = confirmHandler;
    } else if (element?.hasAttribute('data-alis-confirm-message')) {
      const confirmFallback =
        /** @param {import('../pipeline/context.js').PipelineContext} ctx */
        (ctx) => executeElementConfirm(element, ctx);
      config.confirm = confirmFallback;
    }
    if (attrs.trigger) config.trigger = attrs.trigger;
    
    // Parse onBefore and onAfter hooks from attributes
    // Format: data-alis-on-before="functionName" or data-alis-on-after="fn1, fn2"
    if (attrs['on-before']) {
      config.onBefore = parseHooks(attrs['on-before']);
    }
    if (attrs['on-after']) {
      config.onAfter = parseHooks(attrs['on-after']);
    }
    
    return config;
  }

  /**
   * Parse hook attribute value into array of functions
   * @param {string} value - Comma-separated function names
   * @returns {Array<(ctx: import('../pipeline/context.js').PipelineContext) => void>}
   */
  function parseHooks(value) {
    if (!value || typeof window === 'undefined') return [];
    
    return value.split(',')
      .map(name => name.trim())
      .filter(Boolean)
      .map(name => {
        const fn = /** @type {Record<string, unknown>} */ (window)[name];
        if (typeof fn === 'function') {
          return /** @type {(ctx: import('../pipeline/context.js').PipelineContext) => void} */ (fn);
        }
        console.warn(`[ALIS] Hook function "${name}" not found on window`);
        return null;
      })
      .filter(/** @type {(fn: unknown) => fn is Function} */ (fn => fn !== null));
  }

  /**
   * @param {string} value
   */
  function parseRetry(value) {
    if (value === 'false') return false;
    if (value === 'true') return true;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * @param {Record<string, unknown>} source
   */
  function extractData(source) {
    if (source && Object.prototype.hasOwnProperty.call(source, 'data')) {
      return /** @type {{ data?: unknown }} */ (source).data;
    }
    return undefined;
  }

  /**
   * @param {Record<string, unknown> & { data?: unknown }} options
   * @param {Record<string, unknown>} globalConfig
   */
  function request(options = {}, globalConfig = {}) {
    const config = { ...globalConfig, ...options };
    const element = options.element instanceof Element ? options.element : null;
    const ctx = createContext(element, { config });
    const data = extractData(options);
    if (data !== undefined) {
      ctx.collect = { source: null, data };
    }
    return runDefaultPipeline(ctx);
  }

  /**
   * @param {Element} element
   * @param {Record<string, unknown> & { data?: unknown }} overrides
   * @param {Record<string, unknown>} globalConfig
   */
  function trigger(element, overrides = {}, globalConfig = {}) {
    const ctx = createContextForElement(element, overrides, globalConfig);
    const data = extractData(overrides);
    if (data !== undefined) {
      ctx.collect = { source: element, data };
    }
    return runDefaultPipeline(ctx);
  }

  /**
   * @param {Element} element
   * @param {Record<string, unknown>} globalConfig
   */
  function from(element, globalConfig = {}) {
    return {
      execute(overrides = {}) {
        const ctx = createContextForElement(element, overrides, globalConfig);
        const data = extractData(overrides);
        if (data !== undefined) {
          ctx.collect = { source: element, data };
        }
        return runDefaultPipeline(ctx);
      }
    };
  }

  const EVENT_DELIMITER = ',';

  /**
   * @typedef {Object} ParsedTrigger
   * @property {string | null} selector
   * @property {string | null} event
   * @property {number} delay - Debounce delay in ms (0 = no debounce)
   * @property {number} throttle - Throttle interval in ms (0 = no throttle)
   */

  /**
   * @param {string | null} value
   * @returns {ParsedTrigger[]}
   */
  function parseTrigger(value) {
    if (!value || typeof value !== 'string') {
      return [{ selector: null, event: null, delay: 0, throttle: 0 }];
    }
    return value
      .split(EVENT_DELIMITER)
      .map(part => part.trim())
      .filter(Boolean)
      .map(parseOne);
  }

  /**
   * Parse a single trigger entry
   * Formats:
   *   - "click" -> { event: "click" }
   *   - "input delay:500ms" -> { event: "input", delay: 500 }
   *   - "scroll throttle:200ms" -> { event: "scroll", throttle: 200 }
   *   - "#btn@click" -> { selector: "#btn", event: "click" }
   *   - "change delay:300ms throttle:100ms" -> { event: "change", delay: 300, throttle: 100 }
   * 
   * @param {string} entry
   * @returns {ParsedTrigger}
   */
  function parseOne(entry) {
    const parts = entry.split(/\s+/);
    let eventPart = parts[0];
    let selector = null;
    let event = null;
    let delay = 0;
    let throttle = 0;
    
    // Check for selector@event format
    if (eventPart.includes('@')) {
      const [sel, evt] = eventPart.split('@');
      selector = sel || null;
      event = evt || null;
    } else {
      event = eventPart;
    }
    
    // Parse modifiers (delay:Xms, throttle:Xms)
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const delayMatch = part.match(/^delay:(\d+)(ms)?$/i);
      const throttleMatch = part.match(/^throttle:(\d+)(ms)?$/i);
      
      if (delayMatch) {
        delay = parseInt(delayMatch[1], 10);
      } else if (throttleMatch) {
        throttle = parseInt(throttleMatch[1], 10);
      }
    }
    
    return { selector, event, delay, throttle };
  }

  /**
   * @param {Element} element
   * @param {Event} event
   */
  function matchesTrigger(element, event) {
    const triggerAttr = element.getAttribute('data-alis-trigger');
    const entries = parseTrigger(triggerAttr);
    const eventType = normalizeEventType(event.type, event);

    return entries.some(entry => {
      // Extract just the event name (without modifiers like delay:500ms)
      const entryEvent = entry.event ? entry.event.split(/\s+/)[0] : null;
      const matchesEvent = !entryEvent || entryEvent === eventType;
      const matchesSelector =
        !entry.selector ||
        (event.target instanceof Element && event.target.matches(entry.selector));
      return matchesEvent && matchesSelector;
    });
  }

  /**
   * @param {string} type
   * @param {Event} event
   */
  function normalizeEventType(type, event) {
    if (type === 'keyup' && 'key' in event && event.key === 'Enter') {
      return 'keyenter';
    }
    return type;
  }

  /**
   * @param {Event} event
   */
  function findTriggerElement(event) {
    let node = /** @type {Element | null} */ (event.target instanceof Element ? event.target : null);
    while (node && node !== document.body) {
      if (isAlisElement(node)) {
        if (shouldHandleEvent(node, event)) {
          return node;
        }
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  /**
   * Check if element has any ALIS attribute (data-alis or data-alis-{method})
   * @param {Element} element
   */
  function isAlisElement(element) {
    if (element.hasAttribute('data-alis')) return true;
    // Check for method-specific attributes
    return ['get', 'post', 'put', 'patch', 'delete'].some(
      method => element.hasAttribute(`data-alis-${method}`)
    );
  }

  /**
   * @param {Element} element
   * @param {Event} event
   */
  function shouldHandleEvent(element, event) {
    if (element.hasAttribute('data-alis-trigger')) {
      return matchesTrigger(element, event);
    }
    const defaultTrigger = getDefaultTrigger(element);
    return normalizeEvent(event.type) === defaultTrigger;
  }

  /**
   * @param {string} type
   */
  function normalizeEvent(type) {
    return type === 'keyup' ? 'change' : type;
  }

  /**
   * Get trigger configuration (delay, throttle) for an element
   * @param {Element} element
   * @returns {{ delay: number; throttle: number }}
   */
  function getTriggerConfig(element) {
    const triggerAttr = element.getAttribute('data-alis-trigger');
    if (!triggerAttr) {
      return { delay: 0, throttle: 0 };
    }
    
    const parsed = parseTrigger(triggerAttr);
    // Use the first trigger's config (most common case)
    const first = parsed[0] || { delay: 0, throttle: 0 };
    return {
      delay: first.delay || 0,
      throttle: first.throttle || 0
    };
  }

  const LISTENERS = new Map();
  /** @type {Map<Element, { timeout: number | null; lastCall: number }>} */
  const DEBOUNCE_STATE = new Map();

  /**
   * @typedef {Object} TriggerOptions
   * @property {boolean} [debounced] - Whether this trigger was debounced
   */

  /**
   * @param {string[]} events
   * @param {(element: Element, event: Event, triggerElement: Element | null, options?: TriggerOptions) => void} onTrigger
   */
  function setupDelegation(events = ['click', 'submit', 'change', 'input', 'scroll'], onTrigger) {
    events.forEach(eventType => {
      if (LISTENERS.has(eventType)) return;
      const handler = /** @type {(event: Event) => void} */ (event => {
        const target = findTriggerElement(event);
        if (!target) return;
        
        // Get trigger config for debounce/throttle
        const triggerConfig = getTriggerConfig(target);
        
        // Handle debounce
        if (triggerConfig.delay > 0) {
          handleDebounce(target, triggerConfig.delay, () => {
            executeHandler(target, event, onTrigger, { debounced: true });
          });
          if (event.cancelable) event.preventDefault();
          return;
        }
        
        // Handle throttle
        if (triggerConfig.throttle > 0) {
          if (!handleThrottle(target, triggerConfig.throttle)) {
            return; // Throttled, skip this event
          }
        }
        
        if (event.cancelable) {
          event.preventDefault();
        }
        executeHandler(target, event, onTrigger, {});
      });
      const useCapture = eventType === 'submit';
      document.addEventListener(eventType, handler, useCapture);
      LISTENERS.set(eventType, handler);
    });
  }

  /**
   * @param {Element} target
   * @param {Event} event
   * @param {(element: Element, event: Event, triggerElement: Element | null, options?: TriggerOptions) => void} onTrigger
   * @param {TriggerOptions} options
   */
  function executeHandler(target, event, onTrigger, options) {
    if (typeof onTrigger === 'function') {
      const triggerElement = getTriggerElement(event);
      onTrigger(target, event, triggerElement, options);
    }
  }

  /**
   * @param {Element} element
   * @param {number} delay
   * @param {() => void} callback
   */
  function handleDebounce(element, delay, callback) {
    const state = DEBOUNCE_STATE.get(element) || { timeout: null, lastCall: 0 };
    
    if (state.timeout !== null) {
      clearTimeout(state.timeout);
    }
    
    state.timeout = window.setTimeout(() => {
      state.timeout = null;
      callback();
    }, delay);
    
    DEBOUNCE_STATE.set(element, state);
  }

  /**
   * @param {Element} element
   * @param {number} interval
   * @returns {boolean} - true if should proceed, false if throttled
   */
  function handleThrottle(element, interval) {
    const state = DEBOUNCE_STATE.get(element) || { timeout: null, lastCall: 0 };
    const now = Date.now();
    
    if (now - state.lastCall < interval) {
      return false;
    }
    
    state.lastCall = now;
    DEBOUNCE_STATE.set(element, state);
    return true;
  }

  /**
   * @param {Event} event
   */
  function getTriggerElement(event) {
    if (typeof SubmitEvent !== 'undefined' && event instanceof SubmitEvent && event.submitter) {
      return event.submitter;
    }
    return event.target instanceof Element ? event.target : null;
  }

  /**
   * Creates the validation module public API.
   * @returns {Object}
   */
  function createValidationAPI() {
    const engine = new ValidationEngine();
    
    return {
      /**
       * Validate a single field.
       * @param {Element} field
       * @param {{ showErrors?: boolean }} [options]
       */
      validateField(field, options = {}) {
        return engine.validateField(field, options);
      },
      
      /**
       * Validate all fields in a form.
       * @param {HTMLFormElement} form
       * @param {{ showErrors?: boolean }} [options]
       */
      validateForm(form, options = {}) {
        return engine.validateForm(form, options);
      },
      
      /**
       * Register a custom validator.
       * @param {string} name
       * @param {import('../ValidatorRegistry.js').ValidatorFn} validator
       */
      registerValidator(name, validator) {
        engine.registerValidator(name, validator);
      },
      
      /**
       * Clear all validation errors in a form.
       * @param {HTMLFormElement} form
       */
      clearErrors(form) {
        engine.clearErrors(form);
      }
    };
  }

  const VERSION = '0.0.1';
  /** @type {Record<string, unknown>} */
  let globalConfig = {};

  /**
   * @param {Element} element
   * @param {Record<string, unknown>} overrides
   */
  function handleTrigger(element, overrides = {}) {
    return trigger(element, overrides, globalConfig);
  }

  /**
   * @param {Record<string, unknown>} options
   */
  function handleRequest(options = {}) {
    return request(options, globalConfig);
  }

  /**
   * @param {Element} element
   */
  function handleFrom(element) {
    return from(element, globalConfig);
  }

  // Create validation API instance
  const validationAPI = createValidationAPI();

  const ALIS = {
    version: VERSION,
    init(config = {}) {
      globalConfig = structuredCloneSafe(config);
      setupDelegation(undefined, (element, event, triggerElement, options) => {
        handleTrigger(element, { 
          triggerElement, 
          originEvent: event,
          debounced: options?.debounced 
        }).catch(error => {
          // eslint-disable-next-line no-console
          console.error('[ALIS] trigger failed', error);
        });
      });
      
      return {
        config: structuredCloneSafe(globalConfig),
        initializedAt: Date.now()
      };
    },
    process() {
      return 0;
    },
    trigger: handleTrigger,
    request: handleRequest,
    from: handleFrom,
    confirm: {
      register: registerConfirm
    },
    validation: validationAPI
  };

  /**
   * Deep clone a value, preserving functions (which can't be cloned by structuredClone)
   * @template T
   * @param {T} value
   * @returns {T}
   */
  function structuredCloneSafe(value) {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return /** @type {T} */ (value.map(item => structuredCloneSafe(item)));
    }
    
    // Handle objects - shallow clone to preserve functions
    const result = /** @type {Record<string, unknown>} */ ({});
    for (const key of Object.keys(value)) {
      const val = /** @type {Record<string, unknown>} */ (value)[key];
      if (typeof val === 'function') {
        // Keep functions as-is (can't clone them)
        result[key] = val;
      } else if (val !== null && typeof val === 'object') {
        result[key] = structuredCloneSafe(val);
      } else {
        result[key] = val;
      }
    }
    return /** @type {T} */ (result);
  }

  if (typeof window !== 'undefined') {
    const win = /** @type {Window & typeof globalThis & { ALIS?: typeof ALIS }} */ (window);
    if (!win.ALIS) {
      win.ALIS = ALIS;
    }
  }

  exports.ALIS = ALIS;
  exports.default = ALIS;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=alis.js.map
