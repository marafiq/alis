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
export function mergeConfig(globalConfig = {}, elementConfig = {}) {
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
 * @param {unknown} value
 */
export function _isObject(value) {
  return isObject(value);
}

