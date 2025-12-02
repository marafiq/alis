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
export function parseValidationAttributes(element) {
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

