/**
 * Find a field element by name within a form, with case-insensitive fallback.
 * 
 * @param {Element | null} container - The form or container element
 * @param {string} fieldName - The field name to search for (e.g., "Employee.FirstName")
 * @returns {Element | null} - The matching field element or null
 */
export function findFieldByName(container, fieldName) {
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
export function findValidationSpan(container, fieldName) {
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

