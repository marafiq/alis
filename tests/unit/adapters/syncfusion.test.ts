import { describe, expect, it, beforeEach } from 'vitest';
import { syncfusionAdapter } from '../../../src/adapters/syncfusion.js';

describe('adapters/syncfusion', () => {
  /**
   * Helper to create a mock Syncfusion control
   */
  function createSyncfusionElement(options: {
    name?: string;
    value?: unknown;
    checked?: boolean;
    hiddenElement?: { name: string };
  }) {
    const element = document.createElement('input');

    const instance: Record<string, unknown> = {};
    if (options.name !== undefined) instance.name = options.name;
    if (options.value !== undefined) instance.value = options.value;
    if (options.checked !== undefined) instance.checked = options.checked;
    if (options.hiddenElement) instance.hiddenElement = {
      getAttribute: (attr: string) => attr === 'name' ? options.hiddenElement!.name : null
    };

    (element as any).ej2_instances = [instance];
    return element;
  }

  describe('canHandle', () => {
    it('returns true for element with ej2_instances', () => {
      const el = createSyncfusionElement({ value: 'test' });
      expect(syncfusionAdapter.canHandle(el)).toBe(true);
    });

    it('returns false for element without ej2_instances', () => {
      const el = document.createElement('input');
      expect(syncfusionAdapter.canHandle(el)).toBe(false);
    });

    it('returns false for empty ej2_instances', () => {
      const el = document.createElement('input');
      (el as any).ej2_instances = [];
      expect(syncfusionAdapter.canHandle(el)).toBe(false);
    });
  });

  describe('getFieldName', () => {
    it('returns instance.name if present', () => {
      const el = createSyncfusionElement({ name: 'myField', value: 'test' });
      expect(syncfusionAdapter.getFieldName(el)).toBe('myField');
    });

    it('returns hiddenElement name if instance.name not present', () => {
      const el = createSyncfusionElement({
        value: 'test',
        hiddenElement: { name: 'hiddenField' }
      });
      expect(syncfusionAdapter.getFieldName(el)).toBe('hiddenField');
    });

    it('falls back to element name attribute', () => {
      const el = createSyncfusionElement({ value: 'test' });
      el.setAttribute('name', 'attrName');
      expect(syncfusionAdapter.getFieldName(el)).toBe('attrName');
    });

    it('returns null if no name found', () => {
      const el = createSyncfusionElement({ value: 'test' });
      expect(syncfusionAdapter.getFieldName(el)).toBeNull();
    });
  });

  describe('getValue - Selection Controls', () => {
    it('DropDownList: returns selected value', () => {
      const el = createSyncfusionElement({ value: 'option2' });
      expect(syncfusionAdapter.getValue(el)).toBe('option2');
    });

    it('ComboBox: returns selected/typed value', () => {
      const el = createSyncfusionElement({ value: 'custom-value' });
      expect(syncfusionAdapter.getValue(el)).toBe('custom-value');
    });

    it('AutoComplete: returns selected value', () => {
      const el = createSyncfusionElement({ value: 'suggestion1' });
      expect(syncfusionAdapter.getValue(el)).toBe('suggestion1');
    });

    it('MultiSelect: returns array of selected values', () => {
      const el = createSyncfusionElement({ value: ['red', 'green', 'blue'] });
      expect(syncfusionAdapter.getValue(el)).toEqual(['red', 'green', 'blue']);
    });

    it('MultiSelect: returns empty array when nothing selected', () => {
      const el = createSyncfusionElement({ value: [] });
      expect(syncfusionAdapter.getValue(el)).toEqual([]);
    });

    it('ListBox: returns selected value', () => {
      const el = createSyncfusionElement({ value: 'item1' });
      expect(syncfusionAdapter.getValue(el)).toBe('item1');
    });

    it('ListBox: returns array for multi-select mode', () => {
      const el = createSyncfusionElement({ value: ['item1', 'item2'] });
      expect(syncfusionAdapter.getValue(el)).toEqual(['item1', 'item2']);
    });
  });

  describe('getValue - Date/Time Controls', () => {
    it('DatePicker: returns Date object', () => {
      const date = new Date('2024-01-15');
      const el = createSyncfusionElement({ value: date });
      expect(syncfusionAdapter.getValue(el)).toEqual(date);
    });

    it('TimePicker: returns Date object with time', () => {
      const time = new Date('1970-01-01T14:30:00');
      const el = createSyncfusionElement({ value: time });
      expect(syncfusionAdapter.getValue(el)).toEqual(time);
    });

    it('DateTimePicker: returns Date object', () => {
      const datetime = new Date('2024-01-15T14:30:00');
      const el = createSyncfusionElement({ value: datetime });
      expect(syncfusionAdapter.getValue(el)).toEqual(datetime);
    });

    it('DateRangePicker: returns array of start/end dates', () => {
      const range = [new Date('2024-01-01'), new Date('2024-01-31')];
      const el = createSyncfusionElement({ value: range });
      expect(syncfusionAdapter.getValue(el)).toEqual(range);
    });

    it('DatePicker: returns null when no date selected', () => {
      const el = createSyncfusionElement({ value: null });
      expect(syncfusionAdapter.getValue(el)).toBeNull();
    });
  });

  describe('getValue - Toggle Controls', () => {
    it('Checkbox: returns true when checked', () => {
      const el = createSyncfusionElement({ checked: true });
      expect(syncfusionAdapter.getValue(el)).toBe(true);
    });

    it('Checkbox: returns false when unchecked', () => {
      const el = createSyncfusionElement({ checked: false });
      expect(syncfusionAdapter.getValue(el)).toBe(false);
    });

    it('Switch: returns true when on', () => {
      const el = createSyncfusionElement({ checked: true });
      expect(syncfusionAdapter.getValue(el)).toBe(true);
    });

    it('Switch: returns false when off', () => {
      const el = createSyncfusionElement({ checked: false });
      expect(syncfusionAdapter.getValue(el)).toBe(false);
    });
  });

  describe('getValue - Input Controls', () => {
    it('NumericTextBox: returns number value', () => {
      const el = createSyncfusionElement({ value: 42.5 });
      expect(syncfusionAdapter.getValue(el)).toBe(42.5);
    });

    it('NumericTextBox: returns 0 for zero', () => {
      const el = createSyncfusionElement({ value: 0 });
      expect(syncfusionAdapter.getValue(el)).toBe(0);
    });

    it('TextBox: returns string value', () => {
      const el = createSyncfusionElement({ value: 'Hello World' });
      expect(syncfusionAdapter.getValue(el)).toBe('Hello World');
    });

    it('TextBox: returns empty string', () => {
      const el = createSyncfusionElement({ value: '' });
      expect(syncfusionAdapter.getValue(el)).toBe('');
    });

    it('MaskedTextBox: returns masked value', () => {
      const el = createSyncfusionElement({ value: '(555) 123-4567' });
      expect(syncfusionAdapter.getValue(el)).toBe('(555) 123-4567');
    });
  });

  describe('getValue - Range Controls', () => {
    it('Slider: returns single number value', () => {
      const el = createSyncfusionElement({ value: 75 });
      expect(syncfusionAdapter.getValue(el)).toBe(75);
    });

    it('RangeSlider: returns array [min, max]', () => {
      const el = createSyncfusionElement({ value: [20, 80] });
      expect(syncfusionAdapter.getValue(el)).toEqual([20, 80]);
    });
  });

  describe('getValue - Special Controls', () => {
    it('ColorPicker: returns hex color string', () => {
      const el = createSyncfusionElement({ value: '#ff5733' });
      expect(syncfusionAdapter.getValue(el)).toBe('#ff5733');
    });

    it('RichTextEditor: returns HTML string', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const el = createSyncfusionElement({ value: html });
      expect(syncfusionAdapter.getValue(el)).toBe(html);
    });
  });

  describe('isCheckbox', () => {
    it('returns true for Checkbox', () => {
      const el = createSyncfusionElement({ checked: true });
      expect(syncfusionAdapter.isCheckbox!(el)).toBe(true);
    });

    it('returns true for Switch', () => {
      const el = createSyncfusionElement({ checked: false });
      expect(syncfusionAdapter.isCheckbox!(el)).toBe(true);
    });

    it('returns false for DropDownList', () => {
      const el = createSyncfusionElement({ value: 'option1' });
      expect(syncfusionAdapter.isCheckbox!(el)).toBe(false);
    });

    it('returns false for TextBox', () => {
      const el = createSyncfusionElement({ value: 'text' });
      expect(syncfusionAdapter.isCheckbox!(el)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles undefined value gracefully', () => {
      const el = createSyncfusionElement({});
      expect(syncfusionAdapter.getValue(el)).toBeNull();
    });

    it('handles null ej2_instances', () => {
      const el = document.createElement('input');
      (el as any).ej2_instances = null;
      expect(syncfusionAdapter.canHandle(el)).toBe(false);
    });

    it('handles missing instance properties', () => {
      const el = document.createElement('input');
      (el as any).ej2_instances = [{}];
      expect(syncfusionAdapter.getValue(el)).toBeNull();
      expect(syncfusionAdapter.getFieldName(el)).toBeNull();
    });
  });
});
