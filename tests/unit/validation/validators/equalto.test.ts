import { describe, expect, it, beforeEach } from 'vitest';
import { validate } from '../../../../src/validation/validators/equalto.js';

describe('equalto validator', () => {
  let form: HTMLFormElement;
  let password: HTMLInputElement;
  let confirmPassword: HTMLInputElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    
    password = document.createElement('input');
    password.name = 'password';
    password.value = 'secret123';
    
    confirmPassword = document.createElement('input');
    confirmPassword.name = 'confirmPassword';
    
    form.appendChild(password);
    form.appendChild(confirmPassword);
    document.body.appendChild(form);
  });

  it('returns invalid when values do not match', () => {
    const result = validate('different', { other: 'password', message: 'Passwords must match' }, confirmPassword);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Passwords must match');
  });

  it('returns valid when values match', () => {
    const result = validate('secret123', { other: 'password', message: 'Passwords must match' }, confirmPassword);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for empty value', () => {
    const result = validate('', { other: 'password', message: 'Passwords must match' }, confirmPassword);
    expect(result.isValid).toBe(true);
  });

  it('returns valid when other field not found', () => {
    const result = validate('test', { other: 'nonexistent', message: 'Must match' }, confirmPassword);
    expect(result.isValid).toBe(true);
  });

  it('handles case-sensitive comparison', () => {
    password.value = 'Secret123';
    const result = validate('secret123', { other: 'password', message: 'Must match' }, confirmPassword);
    expect(result.isValid).toBe(false);
  });

  it('handles asterisk prefix in other field name', () => {
    // ASP.NET Core uses *.FieldName format
    const result = validate('secret123', { other: '*.password', message: 'Must match' }, confirmPassword);
    expect(result.isValid).toBe(true);
  });
});

