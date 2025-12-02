import { describe, expect, it, beforeEach } from 'vitest';
import { SyncfusionAdapter } from '../../../../src/validation/adapters/SyncfusionAdapter.js';

describe('SyncfusionAdapter', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    document.body.appendChild(form);
  });

  function createSyncfusionInput(value: unknown, wrapperClass = 'e-input-group') {
    const wrapper = document.createElement('div');
    wrapper.className = wrapperClass;
    
    const input = document.createElement('input');
    input.type = 'hidden';
    
    // Mock ej2_instances
    (input as unknown as { ej2_instances: Array<{ value: unknown }> }).ej2_instances = [{ value }];
    
    const visibleInput = document.createElement('input');
    visibleInput.className = 'e-input';
    
    wrapper.appendChild(input);
    wrapper.appendChild(visibleInput);
    form.appendChild(wrapper);
    
    return { wrapper, input, visibleInput };
  }

  it('detects Syncfusion element by ej2_instances', () => {
    const { input } = createSyncfusionInput('test');
    expect(SyncfusionAdapter.matches(input)).toBe(true);
  });

  it('returns false for non-Syncfusion element', () => {
    const input = document.createElement('input');
    form.appendChild(input);
    expect(SyncfusionAdapter.matches(input)).toBe(false);
  });

  it('getValue from DropDownList returns ej2_instances[0].value', () => {
    const { input } = createSyncfusionInput('selected-option');
    expect(SyncfusionAdapter.getValue(input)).toBe('selected-option');
  });

  it('getValue from NumericTextBox returns ej2_instances[0].value', () => {
    const { input } = createSyncfusionInput(42);
    expect(SyncfusionAdapter.getValue(input)).toBe(42);
  });

  it('getValue from DatePicker returns ej2_instances[0].value', () => {
    const date = new Date('2024-01-15');
    const { input } = createSyncfusionInput(date);
    expect(SyncfusionAdapter.getValue(input)).toBe(date);
  });

  it('getValue from CheckBox returns ej2_instances[0].checked', () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'e-checkbox-wrapper';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    (input as unknown as { ej2_instances: Array<{ checked: boolean }> }).ej2_instances = [{ checked: true }];
    
    wrapper.appendChild(input);
    form.appendChild(wrapper);
    
    expect(SyncfusionAdapter.getValue(input)).toBe(true);
  });

  it('getVisibleElement returns wrapper', () => {
    const { input, wrapper } = createSyncfusionInput('test');
    expect(SyncfusionAdapter.getVisibleElement(input)).toBe(wrapper);
  });

  it('getBlurTarget returns focusable element', () => {
    const { input, visibleInput } = createSyncfusionInput('test');
    expect(SyncfusionAdapter.getBlurTarget(input)).toBe(visibleInput);
  });

  it('handles null ej2_instances gracefully', () => {
    const input = document.createElement('input');
    (input as unknown as { ej2_instances: null }).ej2_instances = null;
    form.appendChild(input);
    
    expect(SyncfusionAdapter.matches(input)).toBe(false);
  });

  it('falls back to DefaultAdapter behavior if not Syncfusion', () => {
    const input = document.createElement('input');
    input.value = 'regular input';
    form.appendChild(input);
    
    // If matches returns false, the registry will use DefaultAdapter
    expect(SyncfusionAdapter.matches(input)).toBe(false);
  });
});

