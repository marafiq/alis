export class ALISError extends Error {
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

export class ValidationError extends ALISError {
  constructor(message = 'Validation failed', context = {}) {
    super(message, 'VALIDATION_ERROR', context);
  }
}

export class ConfigError extends ALISError {
  constructor(message = 'Configuration error', context = {}) {
    super(message, 'CONFIG_ERROR', context);
  }
}

export class NetworkError extends ALISError {
  constructor(message = 'Network error', context = {}) {
    super(message, 'NETWORK_ERROR', context);
  }
}

export class AbortError extends ALISError {
  constructor(message = 'Request aborted', context = {}) {
    super(message, 'ABORT_ERROR', context);
  }
}

