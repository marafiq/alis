import { describe, expect, it } from 'vitest';
import { resolveCollectSource } from '../../../src/collector/resolver.js';

describe('collector/resolver', () => {
  it('returns form for form element', () => {
    const form = document.createElement('form');
    expect(resolveCollectSource(form, undefined)).toBe(form);
  });

  it('resolves closest selector', () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    const form = document.createElement('form');
    wrapper.appendChild(form);
    document.body.appendChild(wrapper);
    expect(resolveCollectSource(form, 'closest:.wrapper')).toBe(wrapper);
    document.body.removeChild(wrapper);
  });

  it('resolves CSS selector', () => {
    const div = document.createElement('div');
    div.id = 'target';
    document.body.appendChild(div);
    expect(resolveCollectSource(null, '#target')).toBe(div);
    document.body.removeChild(div);
  });
});

