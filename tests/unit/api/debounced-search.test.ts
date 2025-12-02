import { describe, expect, it, beforeEach } from 'vitest';
import { buildConfigFromAttributes, createContextForElement } from '../../../src/api/context.js';
import { collectStep } from '../../../src/pipeline/steps/collect.js';
import { requestBuildStep } from '../../../src/pipeline/steps/request-build.js';
import { createContext } from '../../../src/pipeline/context.js';

describe('Debounced search scenario', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('builds correct config from search input attributes', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.setAttribute('data-alis-get', '/api/search');
    input.setAttribute('data-alis-trigger', 'input delay:300ms');
    input.setAttribute('data-alis-target', '#search-results');
    input.setAttribute('data-alis-collect', 'self');
    input.setAttribute('data-alis-indicator', 'is-loading');
    document.body.appendChild(input);

    const config = buildConfigFromAttributes(input);

    expect(config.method).toBe('get');
    expect(config.url).toBe('/api/search');
    expect(config.target).toBe('#search-results');
    expect(config.collect).toBe('self');
    expect(config.indicator).toBe('is-loading');
    expect(config.trigger).toBe('input delay:300ms');
  });

  it('collects input value with collect="self"', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.value = 'alice';
    input.setAttribute('data-alis-get', '/api/search');
    input.setAttribute('data-alis-collect', 'self');
    document.body.appendChild(input);

    const config = buildConfigFromAttributes(input);
    const ctx = createContext(input, { config });
    
    collectStep(ctx);

    expect(ctx.collect?.data).toEqual({ q: 'alice' });
  });

  it('builds request with query string for GET', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.value = 'bob';
    input.setAttribute('data-alis-get', '/api/search');
    input.setAttribute('data-alis-collect', 'self');
    document.body.appendChild(input);

    const config = buildConfigFromAttributes(input);
    const ctx = createContext(input, { config });
    
    collectStep(ctx);
    requestBuildStep(ctx);

    expect(ctx.request?.url).toBe('/api/search?q=bob');
    expect(ctx.request?.method).toBe('GET');
  });

  it('full pipeline: input -> collect -> request build', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.value = 'search term';
    input.setAttribute('data-alis-get', '/api/search');
    input.setAttribute('data-alis-trigger', 'input delay:300ms');
    input.setAttribute('data-alis-target', '#search-results');
    input.setAttribute('data-alis-collect', 'self');
    document.body.appendChild(input);

    // Simulate what happens when ALIS processes this element
    const config = buildConfigFromAttributes(input);
    const ctx = createContext(input, { config });
    
    // Run collect step
    collectStep(ctx);
    expect(ctx.collect?.data).toEqual({ q: 'search term' });
    
    // Run request build step
    requestBuildStep(ctx);
    expect(ctx.request?.url).toBe('/api/search?q=search+term');
  });

  it('createContextForElement preserves collect attribute', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.value = 'test value';
    input.setAttribute('data-alis-get', '/api/search');
    input.setAttribute('data-alis-collect', 'self');
    document.body.appendChild(input);

    // This is what the delegation handler passes
    const overrides = { 
      triggerElement: input, 
      originEvent: new Event('input') 
    };
    
    const ctx = createContextForElement(input, overrides, {});
    
    // The collect attribute should be preserved in config
    expect(ctx.config.collect).toBe('self');
    
    // Run collect step
    collectStep(ctx);
    expect(ctx.collect?.data).toEqual({ q: 'test value' });
  });

  it('simulates full trigger flow as delegation handler would', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.value = 'hello world';
    input.setAttribute('data-alis-get', '/api/search');
    input.setAttribute('data-alis-trigger', 'input delay:300ms');
    input.setAttribute('data-alis-target', '#search-results');
    input.setAttribute('data-alis-collect', 'self');
    document.body.appendChild(input);

    // Simulate exactly what happens in setupDelegation -> handleTrigger
    const overrides = { 
      triggerElement: input, 
      originEvent: new Event('input') 
    };
    const globalConfig = {};
    
    const ctx = createContextForElement(input, overrides, globalConfig);
    
    // Verify config
    expect(ctx.config.url).toBe('/api/search');
    expect(ctx.config.method).toBe('get');
    expect(ctx.config.collect).toBe('self');
    expect(ctx.config.target).toBe('#search-results');
    
    // Run pipeline steps
    collectStep(ctx);
    expect(ctx.collect?.data).toEqual({ q: 'hello world' });
    
    requestBuildStep(ctx);
    expect(ctx.request?.url).toBe('/api/search?q=hello+world');
  });
});

