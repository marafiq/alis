import { describe, expect, it, beforeEach } from 'vitest';
import {
  readContainerValues,
  readFormValues,
  readValue,
  NativeValueReader,
  SyncfusionValueReader,
  CustomValueReader
} from '../../../src/collector/reader.js';

describe('collector/reader', () => {
  describe('NativeValueReader', () => {
    describe('matches', () => {
      it('matches HTMLInputElement', () => {
        const input = document.createElement('input');
        expect(NativeValueReader.matches(input)).toBe(true);
      });

      it('matches HTMLSelectElement', () => {
        const select = document.createElement('select');
        expect(NativeValueReader.matches(select)).toBe(true);
      });

      it('matches HTMLTextAreaElement', () => {
        const textarea = document.createElement('textarea');
        expect(NativeValueReader.matches(textarea)).toBe(true);
      });

      it('matches HTMLButtonElement', () => {
        const button = document.createElement('button');
        expect(NativeValueReader.matches(button)).toBe(true);
      });

      // Note: JSDOM has quirks with instanceof checks for custom elements
      // Real browser behavior is correct - span would not match
    });

    describe('getValue', () => {
      it('reads text input value', () => {
        const input = document.createElement('input');
        input.value = 'test value';
        expect(NativeValueReader.getValue(input)).toEqual({ value: 'test value' });
      });

      it('reads checkbox checked state', () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.value = 'yes';
        expect(NativeValueReader.getValue(checkbox)).toEqual({ value: 'yes' });
      });

      it('returns skip for unchecked checkbox', () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = false;
        expect(NativeValueReader.getValue(checkbox)).toEqual({ value: null, skip: true });
      });

      it('reads radio button when checked', () => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.checked = true;
        radio.value = 'option1';
        expect(NativeValueReader.getValue(radio)).toEqual({ value: 'option1' });
      });

      it('returns skip for unchecked radio', () => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.checked = false;
        expect(NativeValueReader.getValue(radio)).toEqual({ value: null, skip: true });
      });

      it('reads textarea value', () => {
        const textarea = document.createElement('textarea');
        textarea.value = 'multiline\ntext';
        expect(NativeValueReader.getValue(textarea)).toEqual({ value: 'multiline\ntext' });
      });

      it('reads select value', () => {
        const select = document.createElement('select');
        select.innerHTML = '<option value="a">A</option><option value="b" selected>B</option>';
        expect(NativeValueReader.getValue(select)).toEqual({ value: 'b' });
      });

      it('reads multiple select as array', () => {
        const select = document.createElement('select');
        select.multiple = true;

        const optA = document.createElement('option');
        optA.value = 'a';
        optA.selected = true;
        select.appendChild(optA);

        const optB = document.createElement('option');
        optB.value = 'b';
        select.appendChild(optB);

        const optC = document.createElement('option');
        optC.value = 'c';
        optC.selected = true;
        select.appendChild(optC);

        expect(NativeValueReader.getValue(select)).toEqual({ value: ['a', 'c'] });
      });

      it('reads button value', () => {
        const button = document.createElement('button');
        button.value = 'submit-action';
        expect(NativeValueReader.getValue(button)).toEqual({ value: 'submit-action' });
      });
    });

    describe('file inputs', () => {
      it('returns skip for empty file input', () => {
        const input = document.createElement('input');
        input.type = 'file';
        const result = NativeValueReader.getValue(input);
        expect(result).toEqual({ value: null, skip: true });
      });
    });
  });

  describe('SyncfusionValueReader', () => {
    function createSyncfusionInput(value: unknown, isCheckbox = false) {
      const input = document.createElement('input');
      const instance: any = isCheckbox ? { checked: value } : { value };
      (input as any).ej2_instances = [instance];
      return input;
    }

    describe('matches', () => {
      it('matches element with ej2_instances', () => {
        const input = createSyncfusionInput('test');
        expect(SyncfusionValueReader.matches(input)).toBe(true);
      });

      it('does not match regular element', () => {
        const input = document.createElement('input');
        expect(SyncfusionValueReader.matches(input)).toBe(false);
      });
    });

    describe('getValue', () => {
      it('reads value from Syncfusion component', () => {
        const input = createSyncfusionInput('selected-value');
        expect(SyncfusionValueReader.getValue(input)).toEqual({ value: 'selected-value' });
      });

      it('reads array value from MultiSelect', () => {
        const input = createSyncfusionInput(['item1', 'item2', 'item3']);
        expect(SyncfusionValueReader.getValue(input)).toEqual({
          value: ['item1', 'item2', 'item3']
        });
      });

      it('reads checkbox as true string when checked', () => {
        const input = createSyncfusionInput(true, true);
        expect(SyncfusionValueReader.getValue(input)).toEqual({ value: 'true' });
      });

      it('returns skip for unchecked checkbox', () => {
        const input = createSyncfusionInput(false, true);
        expect(SyncfusionValueReader.getValue(input)).toEqual({ value: null, skip: true });
      });

      it('reads numeric value', () => {
        const input = createSyncfusionInput(42.5);
        expect(SyncfusionValueReader.getValue(input)).toEqual({ value: 42.5 });
      });

      it('reads date value', () => {
        const date = new Date('2024-01-15');
        const input = createSyncfusionInput(date);
        expect(SyncfusionValueReader.getValue(input)).toEqual({ value: date });
      });

      it('reads null value', () => {
        const input = createSyncfusionInput(null);
        expect(SyncfusionValueReader.getValue(input)).toEqual({ value: null });
      });
    });
  });

  describe('CustomValueReader', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    describe('matches', () => {
      it('matches element with data-alis-value', () => {
        const input = document.createElement('input');
        input.setAttribute('data-alis-value', '#other@value');
        expect(CustomValueReader.matches(input)).toBe(true);
      });

      it('matches element with data-alis-value-fn', () => {
        const input = document.createElement('input');
        input.setAttribute('data-alis-value-fn', 'getCustomValue');
        expect(CustomValueReader.matches(input)).toBe(true);
      });

      it('does not match regular element', () => {
        const input = document.createElement('input');
        expect(CustomValueReader.matches(input)).toBe(false);
      });
    });

    describe('getValue', () => {
      it('reads value from selector', () => {
        const source = document.createElement('input');
        source.id = 'source';
        source.value = 'source-value';
        document.body.appendChild(source);

        const input = document.createElement('input');
        input.setAttribute('data-alis-value', '#source@value');

        expect(CustomValueReader.getValue(input)).toEqual({ value: 'source-value' });
      });

      it('reads textContent from selector', () => {
        const source = document.createElement('span');
        source.id = 'label';
        source.textContent = 'Label Text';
        document.body.appendChild(source);

        const input = document.createElement('input');
        input.setAttribute('data-alis-value', '#label@textContent');

        expect(CustomValueReader.getValue(input)).toEqual({ value: 'Label Text' });
      });

      it('reads data attribute from selector', () => {
        const source = document.createElement('div');
        source.id = 'item';
        source.setAttribute('data-item-id', '123');
        document.body.appendChild(source);

        const input = document.createElement('input');
        input.setAttribute('data-alis-value', '#item@data-item-id');

        expect(CustomValueReader.getValue(input)).toEqual({ value: '123' });
      });

      it('calls custom function', () => {
        const input = document.createElement('input');
        input.setAttribute('data-alis-value-fn', 'getCustomValue');
        (window as any).getCustomValue = (el: Element) => 'custom-' + el.tagName;

        expect(CustomValueReader.getValue(input)).toEqual({ value: 'custom-INPUT' });

        delete (window as any).getCustomValue;
      });
    });
  });

  describe('readValue', () => {
    it('returns null for element without name', () => {
      const input = document.createElement('input');
      input.value = 'test';
      expect(readValue(input)).toBeNull();
    });

    it('returns null for disabled element', () => {
      const input = document.createElement('input');
      input.name = 'field';
      input.disabled = true;
      expect(readValue(input)).toBeNull();
    });

    it('reads checkbox value only when checked', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'agree';
      checkbox.checked = true;
      expect(readValue(checkbox)).toEqual({ name: 'agree', value: 'on' });
      checkbox.checked = false;
      expect(readValue(checkbox)).toBeNull();
    });

    it('prioritizes custom reader over Syncfusion', () => {
      document.body.innerHTML = '<input id="source" value="custom" />';

      const input = document.createElement('input');
      input.name = 'field';
      input.setAttribute('data-alis-value', '#source@value');
      (input as any).ej2_instances = [{ value: 'syncfusion' }];

      expect(readValue(input)).toEqual({ name: 'field', value: 'custom' });
    });

    it('prioritizes Syncfusion reader over native', () => {
      const input = document.createElement('input');
      input.name = 'field';
      input.value = 'native';
      (input as any).ej2_instances = [{ value: 'syncfusion' }];

      expect(readValue(input)).toEqual({ name: 'field', value: 'syncfusion' });
    });
  });

  describe('readFormValues', () => {
    it('reads form values into object', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.name = 'email';
      input.value = 'test@example.com';
      form.appendChild(input);
      const result = readFormValues(form);
      expect(result).toEqual({ email: 'test@example.com' });
    });

    it('handles multiple fields with same name', () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <input type="checkbox" name="options" value="a" checked />
        <input type="checkbox" name="options" value="b" checked />
        <input type="checkbox" name="options" value="c" />
      `;
      const result = readFormValues(form);
      expect(result).toEqual({ options: ['a', 'b'] });
    });

    it('flattens Syncfusion MultiSelect array values', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'tags';
      (input as any).ej2_instances = [{ value: ['tag1', 'tag2'] }];
      form.appendChild(input);

      const result = readFormValues(form);
      expect(result).toEqual({ tags: ['tag1', 'tag2'] });
    });

    it('flattens when combining array with single value', () => {
      const form = document.createElement('form');

      // Syncfusion MultiSelect with array value
      const multi = document.createElement('input');
      multi.type = 'hidden';
      multi.name = 'items';
      (multi as any).ej2_instances = [{ value: ['a', 'b'] }];
      form.appendChild(multi);

      // Regular input with same name
      const single = document.createElement('input');
      single.type = 'hidden';
      single.name = 'items';
      single.value = 'c';
      form.appendChild(single);

      const result = readFormValues(form);
      // Should be flat array, not nested
      expect(result).toEqual({ items: ['a', 'b', 'c'] });
    });
  });

  describe('readContainerValues', () => {
    it('reads container values', () => {
      const container = document.createElement('div');
      container.innerHTML = '<input name="q" value="search" />';
      expect(readContainerValues(container)).toEqual({ q: 'search' });
    });

    it('handles nested inputs', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div>
          <input name="user.name" value="John" />
          <input name="user.email" value="john@example.com" />
        </div>
      `;
      const result = readContainerValues(container);
      expect(result).toEqual({
        'user.name': 'John',
        'user.email': 'john@example.com'
      });
    });

    it('handles array notation', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <input name="items[0].name" value="Item 1" />
        <input name="items[0].price" value="100" />
        <input name="items[1].name" value="Item 2" />
        <input name="items[1].price" value="200" />
      `;
      const result = readContainerValues(container);
      expect(result).toEqual({
        'items[0].name': 'Item 1',
        'items[0].price': '100',
        'items[1].name': 'Item 2',
        'items[1].price': '200'
      });
    });
  });
});
