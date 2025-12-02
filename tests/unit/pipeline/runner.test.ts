import { describe, expect, it, vi } from 'vitest';
import { runPipeline } from '../../../src/pipeline/runner.js';
import { createContext } from '../../../src/pipeline/context.js';
type PipelineContext = ReturnType<typeof createContext>;
describe('pipeline/runner', () => {
  it('executes steps sequentially', async () => {
    const element = document.createElement('div');
    const ctx = createContext(element);
    const step = vi.fn(context => ({ ...context, touched: true }));
    const result = await runPipeline(ctx, [step]);
    expect((result as PipelineContext & { touched?: boolean }).touched).toBe(true);
    expect(step).toHaveBeenCalledTimes(1);
  });

  it('stops execution when aborted', async () => {
    const ctx = createContext(document.createElement('div'));
    const steps: Array<(context: PipelineContext) => PipelineContext> = [
      context => {
        context.state.aborted = true;
        return context;
      },
      () => {
        throw new Error('should not run');
      }
    ];

    const result = await runPipeline(ctx, steps);
    expect(result.state.aborted).toBe(true);
  });

  it('propagates errors', async () => {
    const ctx = createContext(document.createElement('div'));
    await expect(runPipeline(ctx, [() => {
      throw new Error('boom');
    }])).rejects.toThrow('boom');
  });
});

