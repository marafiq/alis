import { describe, expect, it, beforeEach } from 'vitest';
import {
  readContainerValues,
  readFormValues,
  readValue
} from '../../../src/collector/reader.js';
// Register Syncfusion adapter for tests
import '../../../src/adapters/syncfusion.js';

describe('collector/reader', () => {
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

    describe('text input', () => {
      it('reads value', () => {
        const input = document.createElement('input');
        input.name = 'email';
        input.value = 'test@example.com';
        expect(readValue(input)).toEqual({ name: 'email', value: 'test@example.com' });
      });
    });

    describe('checkbox', () => {
      it('returns value when checked', () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'agree';
        checkbox.checked = true;
        expect(readValue(checkbox)).toEqual({ name: 'agree', value: 'on' });
      });

      it('returns custom value when checked', () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'agree';
        checkbox.value = 'yes';
        checkbox.checked = true;
        expect(readValue(checkbox)).toEqual({ name: 'agree', value: 'yes' });
      });

      it('returns null when unchecked', () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'agree';
        checkbox.checked = false;
        expect(readValue(checkbox)).toBeNull();
      });
    });

    describe('radio', () => {
      it('returns value when checked', () => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'choice';
        radio.value = 'option1';
        radio.checked = true;
        expect(readValue(radio)).toEqual({ name: 'choice', value: 'option1' });
      });

      it('returns null when unchecked', () => {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'choice';
        radio.checked = false;
        expect(readValue(radio)).toBeNull();
      });
    });

    describe('file input', () => {
      it('returns null for empty file input', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.name = 'upload';
        expect(readValue(input)).toBeNull();
      });
    });

    describe('textarea', () => {
      it('reads value', () => {
        const textarea = document.createElement('textarea');
        textarea.name = 'message';
        textarea.value = 'Hello\nWorld';
        expect(readValue(textarea)).toEqual({ name: 'message', value: 'Hello\nWorld' });
      });
    });

    describe('select', () => {
      it('reads single select value', () => {
        const select = document.createElement('select');
        select.name = 'country';
        select.innerHTML = '<option value="us">US</option><option value="uk" selected>UK</option>';
        expect(readValue(select)).toEqual({ name: 'country', value: 'uk' });
      });

      it('reads multiple select as array', () => {
        const select = document.createElement('select');
        select.name = 'tags';
        select.multiple = true;

        const opt1 = document.createElement('option');
        opt1.value = 'a';
        opt1.selected = true;
        select.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = 'b';
        select.appendChild(opt2);

        const opt3 = document.createElement('option');
        opt3.value = 'c';
        opt3.selected = true;
        select.appendChild(opt3);

        expect(readValue(select)).toEqual({ name: 'tags', value: ['a', 'c'] });
      });
    });

    describe('button', () => {
      it('reads value', () => {
        const button = document.createElement('button');
        button.name = 'action';
        button.value = 'submit';
        expect(readValue(button)).toEqual({ name: 'action', value: 'submit' });
      });
    });

    describe('Syncfusion component', () => {
      function createSyncfusionInput(name: string, value: unknown, isCheckbox = false) {
        const input = document.createElement('input');
        input.name = name;
        const instance: any = isCheckbox ? { checked: value } : { value };
        (input as any).ej2_instances = [instance];
        return input;
      }

      it('reads value from instance', () => {
        const input = createSyncfusionInput('dropdown', 'selected-value');
        expect(readValue(input)).toEqual({ name: 'dropdown', value: 'selected-value' });
      });

      it('reads array value from MultiSelect', () => {
        const input = createSyncfusionInput('multiselect', ['a', 'b', 'c']);
        expect(readValue(input)).toEqual({ name: 'multiselect', value: ['a', 'b', 'c'] });
      });

      it('reads checkbox as true string when checked', () => {
        const input = createSyncfusionInput('sfCheckbox', true, true);
        expect(readValue(input)).toEqual({ name: 'sfCheckbox', value: 'true' });
      });

      it('returns null for unchecked Syncfusion checkbox', () => {
        const input = createSyncfusionInput('sfCheckbox', false, true);
        expect(readValue(input)).toBeNull();
      });

      it('prioritizes Syncfusion over native value', () => {
        const input = document.createElement('input');
        input.name = 'field';
        input.value = 'native';
        (input as any).ej2_instances = [{ value: 'syncfusion' }];
        expect(readValue(input)).toEqual({ name: 'field', value: 'syncfusion' });
      });
    });

    describe('custom value', () => {
      beforeEach(() => {
        document.body.innerHTML = '';
      });

      it('reads value from selector', () => {
        const source = document.createElement('input');
        source.id = 'source';
        source.value = 'source-value';
        document.body.appendChild(source);

        const input = document.createElement('input');
        input.name = 'field';
        input.setAttribute('data-alis-value', '#source@value');
        expect(readValue(input)).toEqual({ name: 'field', value: 'source-value' });
      });

      it('reads textContent from selector', () => {
        const source = document.createElement('span');
        source.id = 'label';
        source.textContent = 'Label Text';
        document.body.appendChild(source);

        const input = document.createElement('input');
        input.name = 'field';
        input.setAttribute('data-alis-value', '#label@textContent');
        expect(readValue(input)).toEqual({ name: 'field', value: 'Label Text' });
      });

      it('calls custom function', () => {
        const input = document.createElement('input');
        input.name = 'field';
        input.setAttribute('data-alis-value-fn', 'getCustomValue');
        (window as any).getCustomValue = (el: Element) => 'custom-' + el.tagName;

        expect(readValue(input)).toEqual({ name: 'field', value: 'custom-INPUT' });

        delete (window as any).getCustomValue;
      });

      it('prioritizes custom value over Syncfusion', () => {
        document.body.innerHTML = '<input id="source" value="custom" />';

        const input = document.createElement('input');
        input.name = 'field';
        input.setAttribute('data-alis-value', '#source@value');
        (input as any).ej2_instances = [{ value: 'syncfusion' }];

        expect(readValue(input)).toEqual({ name: 'field', value: 'custom' });
      });
    });
  });

  describe('readFormValues', () => {
    it('reads form values into object', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.name = 'email';
      input.value = 'test@example.com';
      form.appendChild(input);
      expect(readFormValues(form)).toEqual({ email: 'test@example.com' });
    });

    it('handles multiple fields with same name', () => {
      const form = document.createElement('form');

      const cb1 = document.createElement('input');
      cb1.type = 'checkbox';
      cb1.name = 'options';
      cb1.value = 'a';
      cb1.checked = true;
      form.appendChild(cb1);

      const cb2 = document.createElement('input');
      cb2.type = 'checkbox';
      cb2.name = 'options';
      cb2.value = 'b';
      cb2.checked = true;
      form.appendChild(cb2);

      const cb3 = document.createElement('input');
      cb3.type = 'checkbox';
      cb3.name = 'options';
      cb3.value = 'c';
      cb3.checked = false;
      form.appendChild(cb3);

      expect(readFormValues(form)).toEqual({ options: ['a', 'b'] });
    });

    it('flattens Syncfusion MultiSelect array values', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'tags';
      (input as any).ej2_instances = [{ value: ['tag1', 'tag2'] }];
      form.appendChild(input);

      expect(readFormValues(form)).toEqual({ tags: ['tag1', 'tag2'] });
    });

    it('flattens when combining array with single value', () => {
      const form = document.createElement('form');

      const multi = document.createElement('input');
      multi.type = 'hidden';
      multi.name = 'items';
      (multi as any).ej2_instances = [{ value: ['a', 'b'] }];
      form.appendChild(multi);

      const single = document.createElement('input');
      single.type = 'hidden';
      single.name = 'items';
      single.value = 'c';
      form.appendChild(single);

      expect(readFormValues(form)).toEqual({ items: ['a', 'b', 'c'] });
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

      const div = document.createElement('div');
      const input1 = document.createElement('input');
      input1.name = 'user.name';
      input1.value = 'John';
      div.appendChild(input1);

      const input2 = document.createElement('input');
      input2.name = 'user.email';
      input2.value = 'john@example.com';
      div.appendChild(input2);

      container.appendChild(div);

      expect(readContainerValues(container)).toEqual({
        'user.name': 'John',
        'user.email': 'john@example.com'
      });
    });

    it('handles array notation', () => {
      const container = document.createElement('div');

      const fields = [
        { name: 'items[0].name', value: 'Item 1' },
        { name: 'items[0].price', value: '100' },
        { name: 'items[1].name', value: 'Item 2' },
        { name: 'items[1].price', value: '200' }
      ];

      for (const field of fields) {
        const input = document.createElement('input');
        input.name = field.name;
        input.value = field.value;
        container.appendChild(input);
      }

      expect(readContainerValues(container)).toEqual({
        'items[0].name': 'Item 1',
        'items[0].price': '100',
        'items[1].name': 'Item 2',
        'items[1].price': '200'
      });
    });
  });
});
