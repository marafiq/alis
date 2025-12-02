import { describe, expect, it, beforeEach } from 'vitest';
import { collectStep } from '../../../../src/pipeline/steps/collect.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/collect', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('attaches collected data to context from form', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'email';
    input.value = 'test@example.com';
    form.appendChild(input);
    const ctx = createContext(form);
    const result = collectStep(ctx);
    expect(result.collect?.data).toEqual({ email: 'test@example.com' });
  });

  it('collects self value from input with collect="self"', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.value = 'search term';
    document.body.appendChild(input);

    const ctx = createContext(input, {
      config: { collect: 'self', url: '/api/search', method: 'GET' }
    });
    
    const result = collectStep(ctx);
    
    expect(result.collect?.source).toBe(input);
    expect(result.collect?.data).toEqual({ q: 'search term' });
  });

  it('collects self value from select with collect="self"', () => {
    const select = document.createElement('select');
    select.name = 'country';
    select.innerHTML = '<option value="US">USA</option><option value="UK" selected>UK</option>';
    document.body.appendChild(select);

    const ctx = createContext(select, {
      config: { collect: 'self', url: '/api/states', method: 'GET' }
    });
    
    const result = collectStep(ctx);
    
    expect(result.collect?.source).toBe(select);
    expect(result.collect?.data).toEqual({ country: 'UK' });
  });

  it('collects from closest container with collect="closest:selector"', () => {
    const container = document.createElement('div');
    container.className = 'filter-row';
    
    const input1 = document.createElement('input');
    input1.name = 'name';
    input1.value = 'John';
    
    const input2 = document.createElement('input');
    input2.name = 'age';
    input2.value = '30';
    
    const button = document.createElement('button');
    button.textContent = 'Search';
    
    container.appendChild(input1);
    container.appendChild(input2);
    container.appendChild(button);
    document.body.appendChild(container);

    const ctx = createContext(button, {
      config: { collect: 'closest:.filter-row', url: '/api/search', method: 'GET' }
    });
    
    const result = collectStep(ctx);
    
    expect(result.collect?.source).toBe(container);
    expect(result.collect?.data).toEqual({ name: 'John', age: '30' });
  });

  it('returns null data when collect="none"', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);

    const ctx = createContext(button, {
      config: { collect: 'none', url: '/api/delete', method: 'DELETE' }
    });
    
    const result = collectStep(ctx);
    
    expect(result.collect?.data).toBeNull();
  });

  it('collects from parent form when no collect option specified', () => {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.name = 'username';
    input.value = 'testuser';
    
    const button = document.createElement('button');
    button.type = 'submit';
    
    form.appendChild(input);
    form.appendChild(button);
    document.body.appendChild(form);

    // Button inside form, no collect option
    const ctx = createContext(button, {
      config: { url: '/api/login', method: 'POST' }
    });
    
    const result = collectStep(ctx);
    
    expect(result.collect?.source).toBe(form);
    expect(result.collect?.data).toEqual({ username: 'testuser' });
  });
});

