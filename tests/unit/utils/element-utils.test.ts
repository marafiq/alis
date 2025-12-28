import { describe, expect, it } from 'vitest';
import { canBeDisabled, resolveElement } from '../../../src/utils/element-utils.js';

describe('utils/element-utils', () => {
  it('identifies elements that can be disabled', () => {
    expect(canBeDisabled(document.createElement('button'))).toBe(true);
    expect(canBeDisabled(document.createElement('input'))).toBe(true);
    expect(canBeDisabled(document.createElement('select'))).toBe(true);
    expect(canBeDisabled(document.createElement('textarea'))).toBe(true);
    expect(canBeDisabled(document.createElement('div'))).toBe(false);
    expect(canBeDisabled(document.createElement('span'))).toBe(false);
    expect(canBeDisabled(null)).toBe(false);
  });

  it('resolves selector strings', () => {
    const el = document.createElement('div');
    el.id = 'target';
    document.body.appendChild(el);
    expect(resolveElement('#target')).toBe(el);
    document.body.removeChild(el);
  });
});
