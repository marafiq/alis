import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/api/pipeline.js', () => {
  return {
    runDefaultPipeline: vi.fn(ctx => Promise.resolve(ctx))
  };
});

describe('api/from', () => {
  it('returns executor that runs pipeline with overrides', async () => {
    const { from } = await import('../../../src/api/from.js');
    const button = document.createElement('button');
    const instance = from(button, { timeout: 200 });
    const ctx = await instance.execute({ data: { foo: 'bar' } });
    expect(ctx.config.timeout).toBe(200);
    expect(ctx.collect?.data).toEqual({ foo: 'bar' });
  });
});

