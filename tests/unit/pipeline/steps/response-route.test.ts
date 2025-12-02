import { describe, expect, it } from 'vitest';
import { responseRouteStep } from '../../../../src/pipeline/steps/response-route.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/response-route', () => {
  it('marks success for 2xx responses', () => {
    const ctx = createContext(document.createElement('div'));
    ctx.response = new Response('ok', { status: 200 });
    const result = responseRouteStep(ctx);
    expect(result.success).toBe(true);
  });

  it('marks validation error when ctx.validation present', () => {
    const ctx = createContext(document.createElement('div'));
    ctx.response = new Response('bad', { status: 400 });
    ctx.validation = { errors: { email: ['Invalid'] } };
    const result = responseRouteStep(ctx);
    expect(result.success).toBe(false);
  });
});

