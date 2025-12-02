import { describe, expect, it } from 'vitest';
import { ValidationResult } from '../../../src/validation/ValidationResult.js';

describe('ValidationResult', () => {
  describe('valid()', () => {
    it('creates a valid result', () => {
      const result = ValidationResult.valid();
      expect(result.isValid).toBe(true);
      expect(result.message).toBeNull();
    });
  });

  describe('invalid()', () => {
    it('creates an invalid result with message', () => {
      const result = ValidationResult.invalid('This field is required');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('This field is required');
    });

    it('creates an invalid result with empty message', () => {
      const result = ValidationResult.invalid('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('');
    });
  });

  describe('immutability', () => {
    it('cannot modify isValid after creation', () => {
      const result = ValidationResult.valid();
      expect(() => {
        // @ts-expect-error - testing immutability
        result.isValid = false;
      }).toThrow();
    });

    it('cannot modify message after creation', () => {
      const result = ValidationResult.invalid('Error');
      expect(() => {
        // @ts-expect-error - testing immutability
        result.message = 'Different error';
      }).toThrow();
    });
  });

  describe('combine()', () => {
    it('returns valid when all results are valid', () => {
      const results = [
        ValidationResult.valid(),
        ValidationResult.valid(),
        ValidationResult.valid()
      ];
      const combined = ValidationResult.combine(results);
      expect(combined.isValid).toBe(true);
      expect(combined.messages).toEqual([]);
    });

    it('returns invalid if any result is invalid', () => {
      const results = [
        ValidationResult.valid(),
        ValidationResult.invalid('Error 1'),
        ValidationResult.valid()
      ];
      const combined = ValidationResult.combine(results);
      expect(combined.isValid).toBe(false);
    });

    it('collects all error messages', () => {
      const results = [
        ValidationResult.invalid('Error 1'),
        ValidationResult.valid(),
        ValidationResult.invalid('Error 2')
      ];
      const combined = ValidationResult.combine(results);
      expect(combined.messages).toEqual(['Error 1', 'Error 2']);
    });

    it('handles empty array', () => {
      const combined = ValidationResult.combine([]);
      expect(combined.isValid).toBe(true);
      expect(combined.messages).toEqual([]);
    });
  });
});

