import { describe, expect, it, vi } from 'vitest';
import { executeWithRetry } from '../../../src/retry/executor.js';
import { createContext } from '../../../src/pipeline/context.js';

describe('retry/executor', () => {
  it('retries failing operations', async () => {
    const ctx = createContext(document.createElement('div'));
    const responses = [
      Promise.reject(new Error('network')),
      Promise.resolve(new Response('ok'))
    ];
    const operation = vi.fn(() => responses.shift() ?? Promise.resolve(new Response('fallback')));

    const policy = {
      maxAttempts: 2,
      statusCodes: [],
      calculateDelay: () => 0
    };

    const response = await executeWithRetry(operation, ctx, policy);
    expect(response.status).toBe(200);
    expect(ctx.state.attempts).toBe(2);
  });
});

