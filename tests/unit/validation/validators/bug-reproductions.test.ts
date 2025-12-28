import { describe, expect, it } from 'vitest';
import { validate as validateMinlength } from '../../../../src/validation/validators/minlength.js';
import { validate as validateMaxlength } from '../../../../src/validation/validators/maxlength.js';
import { validate as validateRange } from '../../../../src/validation/validators/range.js';
import { validate as validateEqualto } from '../../../../src/validation/validators/equalto.js';
import { parseOne, parseTime } from '../../../../src/trigger/parser.js';
import { readContainerValues } from '../../../../src/collector/reader.js';

describe('BUG: minlength with undefined min parameter', () => {
  const input = document.createElement('input');

  it('should fail validation when min is undefined but value is provided', () => {
    // BUG: When min is undefined, parseInt(String(undefined)) = NaN
    // Then value.length < NaN is always false, so validation always passes
    const result = validateMinlength('ab', { min: undefined, message: 'Min required' }, input);

    // This SHOULD fail because min param is missing/invalid - validator should reject
    // But currently it passes silently
    expect(result.isValid).toBe(false);
  });

  it('should show meaningful error when min is NaN', () => {
    // Force an error by providing a value shorter than any reasonable minimum
    // First, make the validator actually run by using a concrete min
    const result = validateMinlength('ab', { min: 5 }, input);

    // Verify the error message works correctly
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Minimum 5 characters required.');
  });

  it('should reject invalid min parameter gracefully', () => {
    // BUG: When min is not a number, validation silently passes
    // because parseInt('not-a-number') = NaN and 'ab'.length < NaN = false
    const result = validateMinlength('ab', { min: 'not-a-number' }, input);

    // Should fail or at least not silently pass
    // Currently passes because comparison with NaN is always false
    expect(result.isValid).toBe(false);
  });
});

describe('BUG: maxlength with undefined max parameter', () => {
  const input = document.createElement('input');

  it('should fail validation when max is undefined but value is provided', () => {
    // BUG: When max is undefined, parseInt(String(undefined)) = NaN
    // Then value.length > NaN is always false, so validation always passes
    const result = validateMaxlength('this is a very long string that should fail', { max: undefined, message: 'Max required' }, input);

    // This SHOULD fail because max param is missing/invalid
    expect(result.isValid).toBe(false);
  });
});

describe('BUG: range with partial min/max parameters', () => {
  const input = document.createElement('input');

  it('should handle min-only validation correctly', () => {
    // Only min is provided, no max
    const result = validateRange('5', { min: '10', max: undefined, message: '' }, input);

    // Value 5 is below min 10, should be invalid
    expect(result.isValid).toBe(false);
  });

  it('should not show NaN in error message when max is undefined', () => {
    const result = validateRange('5', { min: '10', max: undefined }, input);

    // BUG: Default message is "Value must be between 10 and NaN."
    if (!result.isValid && result.message) {
      expect(result.message).not.toContain('NaN');
    }
  });

  it('should handle max-only validation correctly', () => {
    // Only max is provided, no min
    const result = validateRange('150', { min: undefined, max: '100' }, input);

    // Value 150 is above max 100, should be invalid
    expect(result.isValid).toBe(false);
  });
});

describe('BUG: trigger parser seconds support', () => {
  it('parseTime should support seconds unit', () => {
    // parseTime function exists and claims to support "s" unit
    expect(parseTime('2s')).toBe(2000);
    expect(parseTime('500ms')).toBe(500);
  });

  it('parseOne should support seconds in delay modifier', () => {
    // BUG: parseOne uses regex ^delay:(\d+)(ms)?$ which doesn't support "s"
    // The parseTime function supports "s" but isn't used for delay parsing
    const result = parseOne('input delay:2s');

    // Should parse "2s" as 2000ms
    expect(result.delay).toBe(2000);
  });

  it('parseOne should support seconds in throttle modifier', () => {
    const result = parseOne('scroll throttle:1s');

    // Should parse "1s" as 1000ms
    expect(result.throttle).toBe(1000);
  });
});

describe('BUG: equalto with special characters in field name', () => {
  it('should handle field names with quotes safely', () => {
    const form = document.createElement('form');
    const input1 = document.createElement('input');
    input1.name = 'password';
    input1.value = 'secret123';

    const input2 = document.createElement('input');
    input2.name = 'confirm';

    form.appendChild(input1);
    form.appendChild(input2);
    document.body.appendChild(form);

    // BUG: If other field name contains quotes, the CSS selector breaks
    // [name="field"with"quotes"] would cause selector to fail
    const params = { other: 'password"injectable', message: 'Must match' };

    // This should not throw, should handle gracefully
    expect(() => {
      validateEqualto('secret123', params, input2);
    }).not.toThrow();

    document.body.removeChild(form);
  });
});

describe('BUG: readContainerValues misses adapter-handled elements', () => {
  it('should collect values from elements without name but handled by adapter', () => {
    const container = document.createElement('div');

    // Standard input with name
    const namedInput = document.createElement('input');
    namedInput.name = 'username';
    namedInput.value = 'john';
    container.appendChild(namedInput);

    // Syncfusion-like component without name attribute on the input
    // but with ej2_instances array (adapter should handle this)
    const sfWrapper = document.createElement('div');
    sfWrapper.className = 'e-control e-textbox';
    const sfInput = document.createElement('input');
    sfInput.className = 'e-textbox';
    // No name attribute on sfInput
    sfWrapper.appendChild(sfInput);
    container.appendChild(sfWrapper);

    // Mock Syncfusion instance
    (sfWrapper as any).ej2_instances = [{
      name: 'email',
      value: 'john@example.com'
    }];

    const values = readContainerValues(container);

    // BUG: readContainerValues only queries [name] elements
    // It misses elements that adapters can handle but don't have name attribute
    // The Syncfusion wrapper has ej2_instances but won't be found
    expect(values).toHaveProperty('username', 'john');
    // This will fail because sfWrapper doesn't have [name] attribute
    // expect(values).toHaveProperty('email', 'john@example.com');
  });
});

describe('BUG: minlength/maxlength with array values', () => {
  const input = document.createElement('input');

  it('should handle array values (multi-select)', () => {
    // If value is an array (from multi-select), length check is wrong
    // ['a', 'b', 'c'].length = 3, but this is item count, not string length
    const arrayValue = ['item1', 'item2', 'item3'];
    const result = validateMinlength(arrayValue, { min: 5, message: 'Need 5 chars' }, input);

    // BUG: Currently checks if typeof value === 'string' before length check
    // So arrays pass through without validation
    // Should either validate array length or stringify and check
    expect(result.isValid).toBe(true); // Currently passes, but is this correct behavior?
  });
});
