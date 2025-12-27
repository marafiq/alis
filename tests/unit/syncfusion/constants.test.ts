import { describe, it, expect } from 'vitest';
import {
  hasSyncfusionInstance,
  getSyncfusionInstance,
  getSyncfusionValue,
  getSyncfusionVisibleElement,
  isSyncfusionInput,
  findSyncfusionWrapper,
  isSyncfusionWrapper
} from '../../../src/syncfusion/constants.js';

/**
 * Helper to create a mock Syncfusion component structure.
 * Mirrors how Syncfusion actually creates components:
 * - Hidden input with ej2_instances array
 * - Instance has inputWrapper.container or wrapper for visible element
 * - Instance has element or inputElement for the actual input
 */
function createMockSyncfusionComponent(type: 'textbox' | 'checkbox' | 'dropdown' = 'textbox') {
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.id = 'testField';
  hiddenInput.name = 'testField';

  const wrapper = document.createElement('div');
  const visibleInput = document.createElement('input');

  wrapper.appendChild(hiddenInput);
  wrapper.appendChild(visibleInput);

  const instance: any = {
    element: hiddenInput,
    inputElement: visibleInput,
  };

  if (type === 'textbox' || type === 'dropdown') {
    instance.value = 'test-value';
    instance.inputWrapper = { container: wrapper };
  } else if (type === 'checkbox') {
    instance.checked = true;
    instance.wrapper = wrapper;
  }

  (hiddenInput as any).ej2_instances = [instance];

  return { hiddenInput, wrapper, visibleInput, instance };
}

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
      const { hiddenInput } = createMockSyncfusionComponent('checkbox');

      const result = getSyncfusionValue(hiddenInput);
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
      const { hiddenInput } = createMockSyncfusionComponent('textbox');

      const result = getSyncfusionValue(hiddenInput);
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

describe('getSyncfusionVisibleElement', () => {
  it('should return inputWrapper.container for input-based controls', () => {
    const { hiddenInput, wrapper } = createMockSyncfusionComponent('textbox');

    expect(getSyncfusionVisibleElement(hiddenInput)).toBe(wrapper);
  });

  it('should return wrapper for checkbox-like controls', () => {
    const { hiddenInput, wrapper } = createMockSyncfusionComponent('checkbox');

    expect(getSyncfusionVisibleElement(hiddenInput)).toBe(wrapper);
  });

  it('should return element itself if no wrapper properties', () => {
    const input = document.createElement('input');
    (input as any).ej2_instances = [{ value: 'test' }];

    expect(getSyncfusionVisibleElement(input)).toBe(input);
  });

  it('should return element itself if no instance', () => {
    const input = document.createElement('input');
    expect(getSyncfusionVisibleElement(input)).toBe(input);
  });
});

describe('isSyncfusionInput', () => {
  it('should return true for elements with ej2_instances', () => {
    const { hiddenInput } = createMockSyncfusionComponent();
    expect(isSyncfusionInput(hiddenInput)).toBe(true);
  });

  it('should return false for regular elements', () => {
    const input = document.createElement('input');
    expect(isSyncfusionInput(input)).toBe(false);
  });
});

describe('findSyncfusionWrapper', () => {
  it('should find wrapper for element with ej2_instances', () => {
    const { hiddenInput, wrapper } = createMockSyncfusionComponent();

    const found = findSyncfusionWrapper(hiddenInput);
    expect(found).toBe(wrapper);
  });

  it('should return null for regular elements', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    const found = findSyncfusionWrapper(input);
    expect(found).toBeNull();

    document.body.removeChild(input);
  });
});

describe('isSyncfusionWrapper (legacy)', () => {
  it('should return true for elements with ej2_instances', () => {
    const { hiddenInput } = createMockSyncfusionComponent();
    expect(isSyncfusionWrapper(hiddenInput)).toBe(true);
  });

  it('should return false for regular elements', () => {
    const div = document.createElement('div');
    expect(isSyncfusionWrapper(div)).toBe(false);
  });
});
