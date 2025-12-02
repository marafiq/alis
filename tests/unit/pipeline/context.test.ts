import { describe, expect, it } from 'vitest';
import { createContext, createContextFromOptions, generateContextId } from '../../../src/pipeline/context.js';

describe('pipeline/context', () => {
  it('creates context with merged config and trigger', () => {
    const element = document.createElement('button');
    const ctx = createContext(element, { config: { timeout: 5000 } });
    expect(ctx.element).toBe(element);
    expect(ctx.config.timeout).toBe(5000);
    expect(ctx.trigger).toBe('click');
    expect(ctx.id).toMatch(/alis-/);
  });

  it('allows manual creation from options', () => {
    const ctx = createContextFromOptions({ element: null, config: { telemetry: 'debug' }, trigger: 'manual', id: 'test-id' });
    expect(ctx.id).toBe('test-id');
    expect(ctx.trigger).toBe('manual');
    expect(ctx.config.telemetry).toBe('debug');
  });

  it('generates unique ids', () => {
    const first = generateContextId();
    const second = generateContextId();
    expect(first).not.toBe(second);
  });
});

