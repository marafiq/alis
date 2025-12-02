import { describe, expect, it, beforeEach } from 'vitest';
import { ValidatorRegistry } from '../../../src/validation/ValidatorRegistry.js';
import { ValidationResult } from '../../../src/validation/ValidationResult.js';

describe('ValidatorRegistry', () => {
  let registry: ValidatorRegistry;

  beforeEach(() => {
    registry = new ValidatorRegistry();
  });

  it('registers a validator', () => {
    const validator = () => ValidationResult.valid();
    registry.register('required', validator);
    expect(registry.has('required')).toBe(true);
  });

  it('retrieves a registered validator', () => {
    const validator = () => ValidationResult.valid();
    registry.register('required', validator);
    expect(registry.get('required')).toBe(validator);
  });

  it('returns undefined for unknown validator', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('lists all registered validators', () => {
    registry.register('required', () => ValidationResult.valid());
    registry.register('email', () => ValidationResult.valid());
    registry.register('minlength', () => ValidationResult.valid());
    
    const keys = registry.keys();
    expect(keys).toContain('required');
    expect(keys).toContain('email');
    expect(keys).toContain('minlength');
    expect(keys.length).toBe(3);
  });

  it('allows override with flag', () => {
    const original = () => ValidationResult.valid();
    const override = () => ValidationResult.invalid('overridden');
    
    registry.register('required', original);
    registry.register('required', override, { override: true });
    
    expect(registry.get('required')).toBe(override);
  });

  it('throws on duplicate without override flag', () => {
    registry.register('required', () => ValidationResult.valid());
    
    expect(() => {
      registry.register('required', () => ValidationResult.valid());
    }).toThrow(/already registered/);
  });

  it('validator receives value, params, and element', () => {
    const input = document.createElement('input');
    input.value = 'test';
    
    let receivedArgs: [unknown, Record<string, unknown>, Element] | null = null;
    
    const validator = (value: unknown, params: Record<string, unknown>, element: Element) => {
      receivedArgs = [value, params, element];
      return ValidationResult.valid();
    };
    
    registry.register('custom', validator);
    const fn = registry.get('custom');
    fn?.('testValue', { min: 5 }, input);
    
    expect(receivedArgs).toEqual(['testValue', { min: 5 }, input]);
  });

  it('validator returns ValidationResult', () => {
    const validator = (value: unknown) => {
      if (!value) {
        return ValidationResult.invalid('Required');
      }
      return ValidationResult.valid();
    };
    
    registry.register('required', validator);
    const fn = registry.get('required');
    
    const validResult = fn?.('test', {}, document.createElement('input'));
    expect(validResult?.isValid).toBe(true);
    
    const invalidResult = fn?.('', {}, document.createElement('input'));
    expect(invalidResult?.isValid).toBe(false);
    expect(invalidResult?.message).toBe('Required');
  });
});

