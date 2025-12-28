import { describe, expect, it, beforeEach } from 'vitest';
import { coordinateCleanupStep, coordinateStep } from '../../../../src/pipeline/steps/coordinate.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/coordinate', () => {
  beforeEach(() => {
    // Clean up any leftover state between tests by creating/cleaning dummy elements
    const dummy = document.createElement('div');
    const ctx = createContext(dummy);
    coordinateCleanupStep(ctx);
  });

  describe('coordinateStep', () => {
    it('allows first request to proceed', () => {
      const element = document.createElement('button');
      const ctx = createContext(element);
      const result = coordinateStep(ctx);
      expect(result.state.aborted).toBe(false);
      coordinateCleanupStep(ctx);
    });

    it('returns ctx unchanged when element is null', () => {
      const ctx = createContext(null);
      const result = coordinateStep(ctx);
      expect(result.state.aborted).toBe(false);
      expect(result).toBe(ctx);
    });

    describe('ignore strategy (default)', () => {
      it('aborts duplicate request', () => {
        const element = document.createElement('button');
        const first = coordinateStep(createContext(element));
        expect(first.state.aborted).toBe(false);

        const second = coordinateStep(createContext(element));
        expect(second.state.aborted).toBe(true);

        coordinateCleanupStep(first);
      });

      it('aborts multiple rapid requests', () => {
        const element = document.createElement('button');
        const first = coordinateStep(createContext(element));
        const second = coordinateStep(createContext(element));
        const third = coordinateStep(createContext(element));

        expect(first.state.aborted).toBe(false);
        expect(second.state.aborted).toBe(true);
        expect(third.state.aborted).toBe(true);

        coordinateCleanupStep(first);
      });
    });

    describe('abort-previous strategy', () => {
      it('aborts previous request and allows new one', () => {
        const element = document.createElement('button');
        const first = createContext(element, { config: { duplicateRequest: 'abort-previous' } });
        coordinateStep(first);
        expect(first.state.aborted).toBe(false);

        const second = createContext(element, { config: { duplicateRequest: 'abort-previous' } });
        coordinateStep(second);
        expect(second.state.aborted).toBe(false);
        expect(first.abortController.signal.aborted).toBe(true);

        coordinateCleanupStep(second);
      });

      it('aborts multiple previous requests in sequence', () => {
        const element = document.createElement('button');
        const first = createContext(element, { config: { duplicateRequest: 'abort-previous' } });
        coordinateStep(first);

        const second = createContext(element, { config: { duplicateRequest: 'abort-previous' } });
        coordinateStep(second);
        expect(first.abortController.signal.aborted).toBe(true);

        const third = createContext(element, { config: { duplicateRequest: 'abort-previous' } });
        coordinateStep(third);
        expect(second.abortController.signal.aborted).toBe(true);
        expect(third.state.aborted).toBe(false);

        coordinateCleanupStep(third);
      });
    });

    it('handles unknown strategy as ignore', () => {
      const element = document.createElement('button');
      const first = createContext(element, { config: { duplicateRequest: 'unknown-strategy' } });
      coordinateStep(first);

      const second = createContext(element, { config: { duplicateRequest: 'unknown-strategy' } });
      coordinateStep(second);
      expect(second.state.aborted).toBe(true);

      coordinateCleanupStep(first);
    });

    it('allows parallel requests from different elements', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');

      const ctx1 = createContext(button1);
      const ctx2 = createContext(button2);

      coordinateStep(ctx1);
      coordinateStep(ctx2);

      expect(ctx1.state.aborted).toBe(false);
      expect(ctx2.state.aborted).toBe(false);

      coordinateCleanupStep(ctx1);
      coordinateCleanupStep(ctx2);
    });
  });

  describe('coordinateCleanupStep', () => {
    it('removes element from active requests', () => {
      const element = document.createElement('button');
      const first = createContext(element);
      coordinateStep(first);
      coordinateCleanupStep(first);

      const second = createContext(element);
      coordinateStep(second);
      expect(second.state.aborted).toBe(false);

      coordinateCleanupStep(second);
    });

    it('only removes matching context ID', () => {
      const element = document.createElement('button');
      const first = createContext(element);
      coordinateStep(first);

      const second = createContext(element);
      // Don't run coordinateStep on second, just cleanup
      // This simulates cleanup with wrong ID
      coordinateCleanupStep(second);

      // First should still be active since IDs don't match
      const third = createContext(element);
      coordinateStep(third);
      expect(third.state.aborted).toBe(true);

      coordinateCleanupStep(first);
    });

    it('handles cleanup when no active request exists', () => {
      const element = document.createElement('button');
      const ctx = createContext(element);
      // Should not throw
      expect(() => coordinateCleanupStep(ctx)).not.toThrow();
    });

    it('handles null element', () => {
      const ctx = createContext(null);
      expect(() => coordinateCleanupStep(ctx)).not.toThrow();
    });
  });
});
