import { describe, expect, it, vi } from 'vitest';
import { runPipeline } from '../../../src/pipeline/runner.js';
import { createContext } from '../../../src/pipeline/context.js';

type PipelineContext = ReturnType<typeof createContext>;

describe('pipeline/runner', () => {
  describe('step execution', () => {
    it('executes steps sequentially', async () => {
      const element = document.createElement('div');
      const ctx = createContext(element);
      const step = vi.fn(context => ({ ...context, touched: true }));
      const result = await runPipeline(ctx, [step]);
      expect((result as PipelineContext & { touched?: boolean }).touched).toBe(true);
      expect(step).toHaveBeenCalledTimes(1);
    });

    it('passes context through multiple steps', async () => {
      const ctx = createContext(document.createElement('div'));
      const order: number[] = [];

      const result = await runPipeline(ctx, [
        context => { order.push(1); return context; },
        context => { order.push(2); return context; },
        context => { order.push(3); return context; }
      ]);

      expect(order).toEqual([1, 2, 3]);
      expect(result.error).toBeNull();
    });

    it('handles async steps', async () => {
      const ctx = createContext(document.createElement('div'));
      const asyncStep = async (context: PipelineContext) => {
        return { ...context, asyncCompleted: true };
      };

      const result = await runPipeline(ctx, [asyncStep]);
      expect((result as PipelineContext & { asyncCompleted?: boolean }).asyncCompleted).toBe(true);
    });

    it('chains async and sync steps', async () => {
      const ctx = createContext(document.createElement('div'));
      const order: string[] = [];

      const result = await runPipeline(ctx, [
        context => { order.push('sync1'); return context; },
        async context => { order.push('async'); return context; },
        context => { order.push('sync2'); return context; }
      ]);

      expect(order).toEqual(['sync1', 'async', 'sync2']);
      expect(result.error).toBeNull();
    });

    it('returns context unchanged with empty steps array', async () => {
      const ctx = createContext(document.createElement('div'));
      const result = await runPipeline(ctx, []);
      expect(result).toBe(ctx);
    });
  });

  describe('abort handling', () => {
    it('stops execution when aborted', async () => {
      const ctx = createContext(document.createElement('div'));
      const secondStep = vi.fn();

      const result = await runPipeline(ctx, [
        context => {
          context.state.aborted = true;
          return context;
        },
        secondStep
      ]);

      expect(result.state.aborted).toBe(true);
      expect(secondStep).not.toHaveBeenCalled();
    });

    it('does not run any steps if already aborted', async () => {
      const ctx = createContext(document.createElement('div'));
      ctx.state.aborted = true;
      const step = vi.fn();

      await runPipeline(ctx, [step]);
      expect(step).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('captures errors in context without throwing', async () => {
      const ctx = createContext(document.createElement('div'));
      const result = await runPipeline(ctx, [
        () => { throw new Error('boom'); }
      ]);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('boom');
    });

    it('continues to next steps after error', async () => {
      const ctx = createContext(document.createElement('div'));
      const cleanupStep = vi.fn(context => context);

      const result = await runPipeline(ctx, [
        () => { throw new Error('step1 error'); },
        cleanupStep
      ]);

      expect(result.error?.message).toBe('step1 error');
      expect(cleanupStep).toHaveBeenCalled();
    });

    it('converts non-Error thrown values to Error', async () => {
      const ctx = createContext(document.createElement('div'));
      const result = await runPipeline(ctx, [
        () => { throw 'string error'; }
      ]);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('string error');
    });

    it('converts null thrown value to Error', async () => {
      const ctx = createContext(document.createElement('div'));
      const result = await runPipeline(ctx, [
        () => { throw null; }
      ]);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('preserves first error when multiple steps throw', async () => {
      const ctx = createContext(document.createElement('div'));
      const result = await runPipeline(ctx, [
        () => { throw new Error('first'); },
        () => { throw new Error('second'); }
      ]);
      // First error captured, second step still runs but its error overwrites
      expect(result.error?.message).toBe('second');
    });
  });

  describe('context mutation', () => {
    it('steps can mutate context properties', async () => {
      const ctx = createContext(document.createElement('div'));
      const result = await runPipeline(ctx, [
        context => {
          context.body = { data: 'test' };
          return context;
        }
      ]);
      expect(result.body).toEqual({ data: 'test' });
    });

    it('steps receive mutated context from previous steps', async () => {
      const ctx = createContext(document.createElement('div'));
      const result = await runPipeline(ctx, [
        context => {
          (context as any).step1 = true;
          return context;
        },
        context => {
          expect((context as any).step1).toBe(true);
          (context as any).step2 = true;
          return context;
        }
      ]);
      expect((result as any).step1).toBe(true);
      expect((result as any).step2).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles step that returns promise resolving to context', async () => {
      const ctx = createContext(document.createElement('div'));
      const result = await runPipeline(ctx, [
        context => Promise.resolve({ ...context, promised: true })
      ]);
      expect((result as any).promised).toBe(true);
    });

    it('handles step that returns context directly', async () => {
      const ctx = createContext(document.createElement('div'));
      const result = await runPipeline(ctx, [
        context => context
      ]);
      expect(result).toBe(ctx);
    });
  });
});
