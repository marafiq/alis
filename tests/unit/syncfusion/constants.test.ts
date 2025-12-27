import { describe, it, expect, beforeEach } from 'vitest';
import {
  SYNCFUSION_WRAPPER_CLASSES,
  SYNCFUSION_INPUT_CLASSES,
  isSyncfusionWrapper,
  isSyncfusionInput,
  findSyncfusionWrapper,
  hasSyncfusionInstance,
  getSyncfusionInstance,
  getSyncfusionValue
} from '../../../src/syncfusion/constants.js';

describe('Syncfusion constants', () => {
  describe('SYNCFUSION_WRAPPER_CLASSES', () => {
    it('should include common wrapper classes', () => {
      expect(SYNCFUSION_WRAPPER_CLASSES).toContain('e-input-group');
      expect(SYNCFUSION_WRAPPER_CLASSES).toContain('e-control-wrapper');
      expect(SYNCFUSION_WRAPPER_CLASSES).toContain('e-checkbox-wrapper');
    });
  });

  describe('SYNCFUSION_INPUT_CLASSES', () => {
    it('should include common input classes', () => {
      expect(SYNCFUSION_INPUT_CLASSES).toContain('e-input');
      expect(SYNCFUSION_INPUT_CLASSES).toContain('e-dropdownlist');
    });
  });
});

describe('isSyncfusionWrapper', () => {
  it('should return true for elements with wrapper class', () => {
    const div = document.createElement('div');
    div.classList.add('e-input-group');
    expect(isSyncfusionWrapper(div)).toBe(true);
  });

  it('should return false for elements without wrapper class', () => {
    const div = document.createElement('div');
    expect(isSyncfusionWrapper(div)).toBe(false);
  });
});

describe('isSyncfusionInput', () => {
  it('should return true for elements with input class', () => {
    const input = document.createElement('input');
    input.classList.add('e-input');
    expect(isSyncfusionInput(input)).toBe(true);
  });

  it('should return false for elements without input class', () => {
    const input = document.createElement('input');
    expect(isSyncfusionInput(input)).toBe(false);
  });
});

describe('findSyncfusionWrapper', () => {
  it('should find parent wrapper element', () => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('e-input-group');
    const input = document.createElement('input');
    wrapper.appendChild(input);
    document.body.appendChild(wrapper);

    const found = findSyncfusionWrapper(input);
    expect(found).toBe(wrapper);

    document.body.removeChild(wrapper);
  });

  it('should return null if no wrapper found', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    const found = findSyncfusionWrapper(input);
    expect(found).toBeNull();

    document.body.removeChild(input);
  });
});

describe('hasSyncfusionInstance', () => {
  it('should return true for elements with ej2_instances', () => {
    const input = document.createElement('input');
    (input as any).ej2_instances = [{ value: 'test' }];
    expect(hasSyncfusionInstance(input)).toBe(true);
  });

  it('should return false for elements without ej2_instances', () => {
    const input = document.createElement('input');
    expect(hasSyncfusionInstance(input)).toBe(false);
  });

  it('should return false for empty ej2_instances array', () => {
    const input = document.createElement('input');
    (input as any).ej2_instances = [];
    expect(hasSyncfusionInstance(input)).toBe(false);
  });
});

describe('getSyncfusionInstance', () => {
  it('should return first instance', () => {
    const input = document.createElement('input');
    const instance = { value: 'test' };
    (input as any).ej2_instances = [instance];

    expect(getSyncfusionInstance(input)).toBe(instance);
  });

  it('should return null for elements without instances', () => {
    const input = document.createElement('input');
    expect(getSyncfusionInstance(input)).toBeNull();
  });
});

describe('getSyncfusionValue', () => {
  describe('checkbox components', () => {
    it('should return checked state as boolean with isCheckbox flag', () => {
      const input = document.createElement('input');
      (input as any).ej2_instances = [{ checked: true }];

      const result = getSyncfusionValue(input);
      expect(result).toEqual({ value: true, isCheckbox: true });
    });

    it('should return false for unchecked checkbox', () => {
      const input = document.createElement('input');
      (input as any).ej2_instances = [{ checked: false }];

      const result = getSyncfusionValue(input);
      expect(result).toEqual({ value: false, isCheckbox: true });
    });
  });

  describe('value components', () => {
    it('should return value with isCheckbox false', () => {
      const input = document.createElement('input');
      (input as any).ej2_instances = [{ value: 'test-value' }];

      const result = getSyncfusionValue(input);
      expect(result).toEqual({ value: 'test-value', isCheckbox: false });
    });

    it('should return numeric values', () => {
      const input = document.createElement('input');
      (input as any).ej2_instances = [{ value: 42 }];

      const result = getSyncfusionValue(input);
      expect(result).toEqual({ value: 42, isCheckbox: false });
    });

    it('should return null value when set', () => {
      const input = document.createElement('input');
      (input as any).ej2_instances = [{ value: null }];

      const result = getSyncfusionValue(input);
      expect(result).toEqual({ value: null, isCheckbox: false });
    });
  });

  it('should return null for elements without instances', () => {
    const input = document.createElement('input');
    expect(getSyncfusionValue(input)).toBeNull();
  });

  it('should return null for instance without value or checked', () => {
    const input = document.createElement('input');
    (input as any).ej2_instances = [{ otherProp: 'test' }];

    expect(getSyncfusionValue(input)).toBeNull();
  });
});
