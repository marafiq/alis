import { describe, expect, it, beforeEach } from 'vitest';
import { requestBuildStep } from '../../../../src/pipeline/steps/request-build.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('requestBuildStep serialization defaults', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('uses formdata serializer by default for form elements', () => {
    const form = document.createElement('form');
    form.setAttribute('action', '/api/save');
    form.setAttribute('method', 'post');
    document.body.appendChild(form);

    const ctx = createContext(form, {
      config: { url: '/api/save', method: 'POST' }
    });
    ctx.collect = { 
      source: form, 
      data: { 'Employee.FirstName': 'John', 'Employee.LastName': 'Doe' } 
    };

    requestBuildStep(ctx);

    // FormData body - browser sets Content-Type automatically
    expect(ctx.request?.body).toBeInstanceOf(FormData);
    expect(ctx.request?.headers?.['Content-Type']).toBeUndefined();
  });

  it('uses json serializer by default for non-form elements', () => {
    const button = document.createElement('button');
    button.setAttribute('data-alis-post', '/api/save');
    document.body.appendChild(button);

    const ctx = createContext(button, {
      config: { url: '/api/save', method: 'POST' }
    });
    ctx.collect = { 
      source: button, 
      data: { name: 'John' } 
    };

    requestBuildStep(ctx);

    // JSON body with Content-Type header
    expect(typeof ctx.request?.body).toBe('string');
    expect(JSON.parse(ctx.request?.body as string)).toEqual({ name: 'John' });
    expect(ctx.request?.headers?.['Content-Type']).toBe('application/json');
  });

  it('respects data-alis-serialize="json" override for forms', () => {
    const form = document.createElement('form');
    form.setAttribute('action', '/api/save');
    form.setAttribute('method', 'post');
    document.body.appendChild(form);

    const ctx = createContext(form, {
      config: { url: '/api/save', method: 'POST', serialize: 'json' }
    });
    ctx.collect = { 
      source: form, 
      data: { name: 'John' } 
    };

    requestBuildStep(ctx);

    // Explicitly requested JSON
    expect(typeof ctx.request?.body).toBe('string');
    expect(JSON.parse(ctx.request?.body as string)).toEqual({ name: 'John' });
    expect(ctx.request?.headers?.['Content-Type']).toBe('application/json');
  });

  it('respects data-alis-serialize="urlencoded" override', () => {
    const form = document.createElement('form');
    form.setAttribute('action', '/api/save');
    form.setAttribute('method', 'post');
    document.body.appendChild(form);

    const ctx = createContext(form, {
      config: { url: '/api/save', method: 'POST', serialize: 'urlencoded' }
    });
    ctx.collect = { 
      source: form, 
      data: { name: 'John', age: '30' } 
    };

    requestBuildStep(ctx);

    // URL-encoded body
    expect(typeof ctx.request?.body).toBe('string');
    expect(ctx.request?.body).toBe('name=John&age=30');
    expect(ctx.request?.headers?.['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('FormData preserves dot-notation keys for nested field names', () => {
    const form = document.createElement('form');
    form.setAttribute('action', '/api/save');
    form.setAttribute('method', 'post');
    document.body.appendChild(form);

    const ctx = createContext(form, {
      config: { url: '/api/save', method: 'POST' }
    });
    ctx.collect = { 
      source: form, 
      data: { 
        'Employee.FirstName': 'John',
        'Employee.LastName': 'Doe',
        'Contacts[0].Email': 'john@example.com'
      } 
    };

    requestBuildStep(ctx);

    const formData = ctx.request?.body as FormData;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('Employee.FirstName')).toBe('John');
    expect(formData.get('Employee.LastName')).toBe('Doe');
    expect(formData.get('Contacts[0].Email')).toBe('john@example.com');
  });

  it('FormData handles file inputs correctly', () => {
    const form = document.createElement('form');
    form.setAttribute('action', '/api/upload');
    form.setAttribute('method', 'post');
    document.body.appendChild(form);

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

    const ctx = createContext(form, {
      config: { url: '/api/upload', method: 'POST' }
    });
    ctx.collect = { 
      source: form, 
      data: { 
        name: 'Document',
        file: file
      } 
    };

    requestBuildStep(ctx);

    const formData = ctx.request?.body as FormData;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('name')).toBe('Document');
    expect(formData.get('file')).toBeInstanceOf(File);
    expect((formData.get('file') as File).name).toBe('test.txt');
  });
});

