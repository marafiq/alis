import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/api/pipeline.js', () => {
  return {
    runDefaultPipeline: vi.fn(ctx => Promise.resolve(ctx))
  };
});

describe('api/request', () => {
  it('creates context with merged config and data', async () => {
    const { request } = await import('../../../src/api/request.js');
    const ctx = await request({ url: '/api', method: 'POST', data: { foo: 'bar' } }, { timeout: 1000 });
    expect(ctx.config.timeout).toBe(1000);
    expect(ctx.collect?.data).toEqual({ foo: 'bar' });
  });
});

