import { describe, expect, it, beforeEach } from 'vitest';
import { findFieldByName, findValidationSpan } from '../../../src/validation/field-matcher.js';

describe('field-matcher', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    document.body.appendChild(form);
  });

  describe('findFieldByName', () => {
    it('finds field with exact name match', () => {
      const input = document.createElement('input');
      input.name = 'Employee.FirstName';
      form.appendChild(input);

      const result = findFieldByName(form, 'Employee.FirstName');
      expect(result).toBe(input);
    });

    it('finds field with case-insensitive fallback', () => {
      const input = document.createElement('input');
      input.name = 'employee.firstname';
      form.appendChild(input);

      // Server returns PascalCase, HTML has lowercase
      const result = findFieldByName(form, 'Employee.FirstName');
      expect(result).toBe(input);
    });

    it('prefers exact match over case-insensitive', () => {
      const exactInput = document.createElement('input');
      exactInput.name = 'Employee.FirstName';
      exactInput.id = 'exact';
      
      const caseInsensitiveInput = document.createElement('input');
      caseInsensitiveInput.name = 'employee.firstname';
      caseInsensitiveInput.id = 'caseInsensitive';
      
      form.appendChild(caseInsensitiveInput);
      form.appendChild(exactInput);

      const result = findFieldByName(form, 'Employee.FirstName');
      expect(result?.id).toBe('exact');
    });

    it('handles array notation in field names', () => {
      const input = document.createElement('input');
      input.name = 'Contacts[0].Email';
      form.appendChild(input);

      const result = findFieldByName(form, 'Contacts[0].Email');
      expect(result).toBe(input);
    });

    it('returns null if no match found', () => {
      const input = document.createElement('input');
      input.name = 'SomethingElse';
      form.appendChild(input);

      const result = findFieldByName(form, 'Employee.FirstName');
      expect(result).toBeNull();
    });

    it('handles null/undefined input gracefully', () => {
      expect(findFieldByName(null, 'test')).toBeNull();
      expect(findFieldByName(form, '')).toBeNull();
      expect(findFieldByName(form, null as unknown as string)).toBeNull();
    });
  });

  describe('findValidationSpan', () => {
    it('finds span with exact data-valmsg-for match', () => {
      const span = document.createElement('span');
      span.setAttribute('data-valmsg-for', 'Employee.FirstName');
      form.appendChild(span);

      const result = findValidationSpan(form, 'Employee.FirstName');
      expect(result).toBe(span);
    });

    it('finds span with case-insensitive fallback', () => {
      const span = document.createElement('span');
      span.setAttribute('data-valmsg-for', 'employee.firstname');
      form.appendChild(span);

      // Server returns PascalCase, HTML has lowercase
      const result = findValidationSpan(form, 'Employee.FirstName');
      expect(result).toBe(span);
    });

    it('prefers exact match over case-insensitive', () => {
      const exactSpan = document.createElement('span');
      exactSpan.setAttribute('data-valmsg-for', 'Employee.FirstName');
      exactSpan.id = 'exact';
      
      const caseInsensitiveSpan = document.createElement('span');
      caseInsensitiveSpan.setAttribute('data-valmsg-for', 'employee.firstname');
      caseInsensitiveSpan.id = 'caseInsensitive';
      
      form.appendChild(caseInsensitiveSpan);
      form.appendChild(exactSpan);

      const result = findValidationSpan(form, 'Employee.FirstName');
      expect(result?.id).toBe('exact');
    });

    it('handles array notation in field names', () => {
      const span = document.createElement('span');
      span.setAttribute('data-valmsg-for', 'Contacts[0].Email');
      form.appendChild(span);

      const result = findValidationSpan(form, 'Contacts[0].Email');
      expect(result).toBe(span);
    });

    it('returns null if no match found', () => {
      const span = document.createElement('span');
      span.setAttribute('data-valmsg-for', 'SomethingElse');
      form.appendChild(span);

      const result = findValidationSpan(form, 'Employee.FirstName');
      expect(result).toBeNull();
    });

    it('handles null/undefined input gracefully', () => {
      expect(findValidationSpan(null, 'test')).toBeNull();
      expect(findValidationSpan(form, '')).toBeNull();
      expect(findValidationSpan(form, null as unknown as string)).toBeNull();
    });
  });
});

