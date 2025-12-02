import { describe, expect, it, vi } from 'vitest';
import { requestExecuteStep } from '../../../../src/pipeline/steps/request-execute.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/request-execute', () => {
  it('performs fetch and stores response', async () => {
    const ctx = createContext(document.createElement('div'), {
      config: { url: '/api', method: 'GET', retry: false }
    });
    ctx.request = {
      url: '/api',
      method: 'GET',
      headers: {},
      body: undefined
    };

    const mockResponse = new Response('ok', { status: 200 });
    global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as unknown as typeof fetch;

    const result = await requestExecuteStep(ctx);
    expect(result.response).toBe(mockResponse);
    expect(result.state.attempts).toBe(1);
  });

  it('retries according to policy', async () => {
    const ctx = createContext(document.createElement('div'), {
      config: { url: '/api', method: 'GET', retry: { maxAttempts: 2, statusCodes: [500], baseDelay: 0, maxDelay: 0, jitter: 0 } }
    });
    ctx.request = {
      url: '/api',
      method: 'GET',
      headers: {},
      body: undefined
    };

    const responses = [
      new Response('error', { status: 500 }),
      new Response('ok', { status: 200 })
    ];
    global.fetch = vi.fn(() => Promise.resolve(responses.shift() ?? new Response('fallback', { status: 200 }))) as unknown as typeof fetch;

    const result = await requestExecuteStep(ctx);
    expect(result.response?.status).toBe(200);
    expect(result.state.attempts).toBe(2);
  });
});

