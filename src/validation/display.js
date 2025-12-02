/**
 * @param {HTMLFormElement} form
 */
export function clearErrors(form) {
  form.querySelectorAll('[data-valmsg-for]').forEach(node => {
    node.textContent = '';
  });
  form.querySelectorAll('[aria-invalid="true"]').forEach(field => {
    field.removeAttribute('aria-invalid');
  });
}

/**
 * @param {HTMLFormElement} form
 * @param {{ errors?: Record<string, string[]> }} details
 */
export function displayErrors(form, details) {
  if (!details?.errors) {
    return;
  }

  Object.entries(details.errors).forEach(([field, messages]) => {
    const target = form.querySelector(`[data-valmsg-for="${field}"]`);
    if (target) {
      target.textContent = messages.join(', ');
    }
    const input = form.querySelector(`[name="${field}"]`);
    if (input) {
      input.setAttribute('aria-invalid', 'true');
    }
  });
}

