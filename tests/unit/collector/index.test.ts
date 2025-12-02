import { describe, expect, it } from 'vitest';
import { collect } from '../../../src/collector/index.js';

describe('collector/index', () => {
  it('collects from form by default', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'name';
    input.value = 'ALIS';
    form.appendChild(input);
    const result = collect(form);
    expect(result.data).toEqual({ name: 'ALIS' });
  });

  it('collects single field when collect=self', () => {
    const input = document.createElement('input');
    input.name = 'email';
    input.value = 'test@example.com';
    const result = collect(input, { collect: 'self' });
    expect(result.data).toEqual({ email: 'test@example.com' });
  });

  it('collects container values via selector', () => {
    const container = document.createElement('div');
    container.id = 'panel';
    container.innerHTML = '<input name="q" value="test" />';
    document.body.appendChild(container);
    const result = collect(container, { collect: '#panel' });
    expect(result.data).toEqual({ q: 'test' });
    document.body.removeChild(container);
  });
});

