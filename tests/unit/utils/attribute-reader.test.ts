import { describe, expect, it } from 'vitest';
import { getAllAttributes, getAttribute, getMethodAndUrl, normalizeSelector } from '../../../src/utils/attribute-reader.js';

describe('utils/attribute-reader', () => {
  it('reads method/url from form', () => {
    const form = document.createElement('form');
    form.setAttribute('action', '/api');
    form.setAttribute('method', 'POST');
    const result = getMethodAndUrl(form);
    expect(result).toEqual({ method: 'post', url: '/api' });
  });

  it('reads method/url from data attributes', () => {
    const button = document.createElement('button');
    button.setAttribute('data-alis-post', '/save');
    const result = getMethodAndUrl(button);
    expect(result).toEqual({ method: 'post', url: '/save' });
  });

  it('reads custom attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-alis-target', 'result');
    expect(getAttribute(el, 'target')).toBe('result');
  });

  it('normalizes selectors', () => {
    expect(normalizeSelector('result')).toBe('#result');
    expect(normalizeSelector('#explicit')).toBe('#explicit');
    expect(normalizeSelector(null)).toBe('');
  });

  it('returns all data-alis attributes', () => {
    const el = document.createElement('div');
    el.setAttribute('data-alis-target', 'result');
    el.setAttribute('data-alis-trigger', 'click');
    expect(getAllAttributes(el)).toEqual({ target: 'result', trigger: 'click' });
  });
});

