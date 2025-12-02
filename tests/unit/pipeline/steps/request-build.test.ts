import { describe, expect, it } from 'vitest';
import { requestBuildStep } from '../../../../src/pipeline/steps/request-build.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/request-build', () => {
  it('builds POST request with JSON body', () => {
    const form = document.createElement('form');
    form.setAttribute('action', '/api/save');
    form.setAttribute('method', 'post');
    const ctx = createContext(form, {
      config: { headers: { 'X-Test': '1' } }
    });
    ctx.collect = { source: form, data: { name: 'ALIS' } };

    const result = requestBuildStep(ctx);

    expect(result.request?.url).toBe('/api/save');
    expect(result.request?.method).toBe('POST');
    expect(result.request?.headers['Content-Type']).toBe('application/json');
    expect(result.request?.body).toBe(JSON.stringify({ name: 'ALIS' }));
  });

  it('appends data to query string for GET', () => {
    const button = document.createElement('button');
    button.setAttribute('data-alis-get', '/api/items');
    button.setAttribute('data-alis-target', 'result');
    const ctx = createContext(button);
    ctx.collect = { source: button, data: { q: 'test' } };

    const result = requestBuildStep(ctx);

    expect(result.request?.url).toBe('/api/items?q=test');
    expect(result.request?.body).toBeUndefined();
  });

  it('throws when url missing', () => {
    const ctx = createContext(null, { config: {} });
    expect(() => requestBuildStep(ctx)).toThrow();
  });
});

