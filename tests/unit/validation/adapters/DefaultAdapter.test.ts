import { describe, expect, it, beforeEach } from 'vitest';
import { DefaultAdapter } from '../../../../src/validation/adapters/DefaultAdapter.js';

describe('DefaultAdapter', () => {
  let form: HTMLFormElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    form = document.createElement('form');
    document.body.appendChild(form);
  });

  it('getValue returns input.value for text input', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'test value';
    form.appendChild(input);
    
    expect(DefaultAdapter.getValue(input)).toBe('test value');
  });

  it('getValue returns checkbox.checked for checkbox', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    form.appendChild(checkbox);
    
    expect(DefaultAdapter.getValue(checkbox)).toBe(true);
    
    checkbox.checked = false;
    expect(DefaultAdapter.getValue(checkbox)).toBe(false);
  });

  it('getValue returns select.value for select', () => {
    const select = document.createElement('select');
    select.innerHTML = `
      <option value="a">A</option>
      <option value="b" selected>B</option>
    `;
    form.appendChild(select);
    
    expect(DefaultAdapter.getValue(select)).toBe('b');
  });

  it('getValue returns textarea.value for textarea', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'multiline\ntext';
    form.appendChild(textarea);
    
    expect(DefaultAdapter.getValue(textarea)).toBe('multiline\ntext');
  });

  it('getVisibleElement returns element itself', () => {
    const input = document.createElement('input');
    form.appendChild(input);
    
    expect(DefaultAdapter.getVisibleElement(input)).toBe(input);
  });

  it('getBlurTarget returns element itself', () => {
    const input = document.createElement('input');
    form.appendChild(input);
    
    expect(DefaultAdapter.getBlurTarget(input)).toBe(input);
  });

  it('handles radio buttons - returns checked value', () => {
    const radio1 = document.createElement('input');
    radio1.type = 'radio';
    radio1.name = 'gender';
    radio1.value = 'male';
    
    const radio2 = document.createElement('input');
    radio2.type = 'radio';
    radio2.name = 'gender';
    radio2.value = 'female';
    radio2.checked = true;
    
    form.appendChild(radio1);
    form.appendChild(radio2);
    
    // Getting value from either radio should return the checked one's value
    expect(DefaultAdapter.getValue(radio1)).toBe('female');
    expect(DefaultAdapter.getValue(radio2)).toBe('female');
  });

  it('handles select multiple - returns array', () => {
    const select = document.createElement('select');
    select.multiple = true;
    select.innerHTML = `
      <option value="a" selected>A</option>
      <option value="b">B</option>
      <option value="c" selected>C</option>
    `;
    form.appendChild(select);
    
    expect(DefaultAdapter.getValue(select)).toEqual(['a', 'c']);
  });
});

