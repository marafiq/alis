import { describe, expect, it } from 'vitest';
import { isFormField, isInteractiveElement, resolveElement } from '../../../src/utils/element-utils.js';

describe('utils/element-utils', () => {
  it('identifies interactive elements', () => {
    const button = document.createElement('button');
    expect(isInteractiveElement(button)).toBe(true);
    expect(isInteractiveElement(document.createElement('div'))).toBe(false);
  });

  it('identifies form fields', () => {
    expect(isFormField(document.createElement('input'))).toBe(true);
    expect(isFormField(document.createElement('select'))).toBe(true);
    expect(isFormField(document.createElement('div'))).toBe(false);
  });

  it('resolves selector strings', () => {
    const el = document.createElement('div');
    el.id = 'target';
    document.body.appendChild(el);
    expect(resolveElement('#target')).toBe(el);
    document.body.removeChild(el);
  });
});

