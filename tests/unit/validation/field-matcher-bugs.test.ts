import { describe, expect, it, beforeEach } from 'vitest';
import { findFieldByName, findValidationSpan } from '../../../src/validation/field-matcher.js';

describe('BUG: findFieldByName CSS selector injection', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    form = document.createElement('form');
    document.body.innerHTML = '';
    document.body.appendChild(form);
  });

  it('should handle field names with double quotes', () => {
    // BUG: The selector [name="${fieldName}"] doesn't escape quotes
    // If fieldName contains quotes, the selector breaks

    const input = document.createElement('input');
    input.name = 'field"with"quotes';
    form.appendChild(input);

    // This will throw or return wrong result due to unescaped quotes
    // [name="field"with"quotes"] is invalid CSS
    expect(() => {
      findFieldByName(form, 'field"with"quotes');
    }).not.toThrow();

    const found = findFieldByName(form, 'field"with"quotes');
    expect(found).toBe(input); // BUG: likely fails
  });

  it('should handle field names with single quotes', () => {
    const input = document.createElement('input');
    input.name = "field'with'quotes";
    form.appendChild(input);

    const found = findFieldByName(form, "field'with'quotes");
    expect(found).toBe(input);
  });

  it('should handle field names with brackets', () => {
    // Common in PHP/Rails: user[email]
    const input = document.createElement('input');
    input.name = 'user[email]';
    form.appendChild(input);

    const found = findFieldByName(form, 'user[email]');
    expect(found).toBe(input);
  });

  it('should handle field names with backslashes', () => {
    const input = document.createElement('input');
    input.name = 'path\\to\\field';
    form.appendChild(input);

    const found = findFieldByName(form, 'path\\to\\field');
    expect(found).toBe(input);
  });
});

describe('BUG: findValidationSpan CSS selector injection', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    form = document.createElement('form');
    document.body.innerHTML = '';
    document.body.appendChild(form);
  });

  it('should handle field names with special characters', () => {
    const span = document.createElement('span');
    span.setAttribute('data-valmsg-for', 'field"name');
    form.appendChild(span);

    // BUG: [data-valmsg-for="${fieldName}"] doesn't escape
    expect(() => {
      findValidationSpan(form, 'field"name');
    }).not.toThrow();

    const found = findValidationSpan(form, 'field"name');
    expect(found).toBe(span); // BUG: likely fails
  });
});

describe('BUG: equalto validator CSS selector injection', () => {
  it('should handle other field names with special characters', async () => {
    const { validate } = await import('../../../src/validation/validators/equalto.js');

    const form = document.createElement('form');
    const input1 = document.createElement('input');
    input1.name = 'password"field';
    input1.value = 'secret';

    const input2 = document.createElement('input');
    input2.name = 'confirm';

    form.appendChild(input1);
    form.appendChild(input2);
    document.body.appendChild(form);

    // BUG: [name="${otherFieldName}"] doesn't escape quotes
    expect(() => {
      validate('secret', { other: 'password"field' }, input2);
    }).not.toThrow();

    document.body.removeChild(form);
  });
});
