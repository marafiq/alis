import { describe, expect, it } from 'vitest';
import { readContainerValues, readFormValues, readValue } from '../../../src/collector/reader.js';

describe('collector/reader', () => {
  it('reads checkbox value only when checked', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'agree';
    checkbox.checked = true;
    expect(readValue(checkbox)).toEqual({ name: 'agree', value: 'on' });
    checkbox.checked = false;
    expect(readValue(checkbox)).toBeNull();
  });

  it('reads form values into object', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'email';
    input.value = 'test@example.com';
    form.appendChild(input);
    const result = readFormValues(form);
    expect(result).toEqual({ email: 'test@example.com' });
  });

  it('reads container values', () => {
    const container = document.createElement('div');
    container.innerHTML = '<input name="q" value="search" />';
    expect(readContainerValues(container)).toEqual({ q: 'search' });
  });
});

