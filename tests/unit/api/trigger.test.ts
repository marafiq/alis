import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/api/pipeline.js', () => {
  return {
    runDefaultPipeline: vi.fn(ctx => Promise.resolve(ctx))
  };
});

describe('api/trigger', () => {
  it('builds config from element attributes', async () => {
    const { trigger } = await import('../../../src/api/trigger.js');
    const button = document.createElement('button');
    button.setAttribute('data-alis-target', 'result');
    const ctx = await trigger(button, {}, { timeout: 500 });
    expect(ctx.config.target).toBe('result');
    expect(ctx.config.timeout).toBe(500);
  });
});

