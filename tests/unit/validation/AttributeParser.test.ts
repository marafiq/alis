import { describe, expect, it, beforeEach } from 'vitest';
import { parseValidationAttributes } from '../../../src/validation/AttributeParser.js';

describe('AttributeParser', () => {
  let input: HTMLInputElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    input = document.createElement('input');
    document.body.appendChild(input);
  });

  it('parses data-val="true" as validation enabled', () => {
    input.setAttribute('data-val', 'true');
    const result = parseValidationAttributes(input);
    expect(result.enabled).toBe(true);
  });

  it('returns empty validators if data-val is not "true"', () => {
    input.setAttribute('data-val', 'false');
    const result = parseValidationAttributes(input);
    expect(result.enabled).toBe(false);
    expect(result.validators).toEqual([]);
  });

  it('parses data-val-required', () => {
    input.setAttribute('data-val', 'true');
    input.setAttribute('data-val-required', 'This field is required');
    
    const result = parseValidationAttributes(input);
    expect(result.validators).toContainEqual({
      name: 'required',
      message: 'This field is required',
      params: {}
    });
  });

  it('parses data-val-minlength with data-val-minlength-min', () => {
    input.setAttribute('data-val', 'true');
    input.setAttribute('data-val-minlength', 'Minimum 5 characters');
    input.setAttribute('data-val-minlength-min', '5');
    
    const result = parseValidationAttributes(input);
    expect(result.validators).toContainEqual({
      name: 'minlength',
      message: 'Minimum 5 characters',
      params: { min: '5' }
    });
  });

  it('parses data-val-range with min and max params', () => {
    input.setAttribute('data-val', 'true');
    input.setAttribute('data-val-range', 'Value must be between 1 and 100');
    input.setAttribute('data-val-range-min', '1');
    input.setAttribute('data-val-range-max', '100');
    
    const result = parseValidationAttributes(input);
    expect(result.validators).toContainEqual({
      name: 'range',
      message: 'Value must be between 1 and 100',
      params: { min: '1', max: '100' }
    });
  });

  it('parses data-val-regex with pattern param', () => {
    input.setAttribute('data-val', 'true');
    input.setAttribute('data-val-regex', 'Invalid format');
    input.setAttribute('data-val-regex-pattern', '^[A-Z]+$');
    
    const result = parseValidationAttributes(input);
    expect(result.validators).toContainEqual({
      name: 'regex',
      message: 'Invalid format',
      params: { pattern: '^[A-Z]+$' }
    });
  });

  it('parses data-val-equalto with other param', () => {
    input.setAttribute('data-val', 'true');
    input.setAttribute('data-val-equalto', 'Passwords must match');
    input.setAttribute('data-val-equalto-other', 'password');
    
    const result = parseValidationAttributes(input);
    expect(result.validators).toContainEqual({
      name: 'equalto',
      message: 'Passwords must match',
      params: { other: 'password' }
    });
  });

  it('handles multiple validators on one field', () => {
    input.setAttribute('data-val', 'true');
    input.setAttribute('data-val-required', 'Required');
    input.setAttribute('data-val-minlength', 'Too short');
    input.setAttribute('data-val-minlength-min', '3');
    input.setAttribute('data-val-email', 'Invalid email');
    
    const result = parseValidationAttributes(input);
    expect(result.validators.length).toBe(3);
    expect(result.validators.map(v => v.name)).toContain('required');
    expect(result.validators.map(v => v.name)).toContain('minlength');
    expect(result.validators.map(v => v.name)).toContain('email');
  });

  it('ignores non-validation attributes', () => {
    input.setAttribute('data-val', 'true');
    input.setAttribute('data-val-required', 'Required');
    input.setAttribute('data-custom', 'some value');
    input.setAttribute('data-other-thing', 'ignored');
    input.setAttribute('class', 'form-control');
    
    const result = parseValidationAttributes(input);
    expect(result.validators.length).toBe(1);
    expect(result.validators[0].name).toBe('required');
  });

  it('returns empty validators array when no data-val attribute', () => {
    input.setAttribute('data-val-required', 'Required');
    
    const result = parseValidationAttributes(input);
    expect(result.enabled).toBe(false);
    expect(result.validators).toEqual([]);
  });
});

