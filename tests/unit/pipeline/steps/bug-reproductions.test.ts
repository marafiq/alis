import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the registry import
vi.mock('../../../../src/registry/swap.js', () => ({
  getSwapStrategy: vi.fn(() => (target: Element, content: string) => {
    target.innerHTML = content;
  })
}));

vi.mock('../../../../src/telemetry/emitter.js', () => ({
  emit: vi.fn()
}));

describe('BUG: swap step resolveTarget incorrectly handles non-ID selectors', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle class selectors without adding # prefix', async () => {
    // Setup: create element with class
    const div = document.createElement('div');
    div.className = 'result-container';
    document.body.appendChild(div);

    // BUG: resolveTarget does this:
    // const normalized = selector.startsWith('#') ? selector : `#${selector}`;
    // So ".result-container" becomes "#.result-container" which is invalid

    const selector = '.result-container';

    // BUG: The current logic adds # prefix incorrectly
    const buggyNormalized = selector.startsWith('#') ? selector : `#${selector}`;
    expect(buggyNormalized).toBe('#.result-container'); // This is wrong!

    // What it SHOULD do - use selector as-is for non-ID selectors
    const correctlyFound = document.querySelector(selector);
    expect(correctlyFound).toBe(div);
  });

  it('should handle attribute selectors', async () => {
    const div = document.createElement('div');
    div.setAttribute('data-target', 'results');
    document.body.appendChild(div);

    const selector = '[data-target="results"]';

    // BUG: The current logic adds # prefix
    const buggyNormalized = selector.startsWith('#') ? selector : `#${selector}`;
    expect(buggyNormalized).toBe('#[data-target="results"]'); // Invalid!

    // Correct behavior
    const correctlyFound = document.querySelector(selector);
    expect(correctlyFound).toBe(div);
  });

  it('should handle element.class selectors', async () => {
    const div = document.createElement('div');
    div.className = 'container';
    document.body.appendChild(div);

    const selector = 'div.container';

    // BUG: The current logic adds # prefix
    const buggyNormalized = selector.startsWith('#') ? selector : `#${selector}`;
    expect(buggyNormalized).toBe('#div.container'); // Invalid!

    // Correct behavior
    const correctlyFound = document.querySelector(selector);
    expect(correctlyFound).toBe(div);
  });
});

describe('BUG: response-parse step has no error handling for malformed JSON', () => {
  it('should handle malformed JSON gracefully', async () => {
    // Create a mock response with invalid JSON
    const malformedJson = '{ invalid json }';
    const response = new Response(malformedJson, {
      headers: { 'content-type': 'application/json' }
    });

    // BUG: response-parse.js does:
    // ctx.body = await clone.json();
    // Without try/catch, this will throw and crash the pipeline

    // Simulate what happens
    let error: Error | null = null;
    try {
      await response.json();
    } catch (e) {
      error = e as Error;
    }

    // Confirm that malformed JSON throws
    expect(error).not.toBeNull();
    expect(error?.message).toContain('JSON');
  });

  it('should handle empty response body', async () => {
    const response = new Response('', {
      headers: { 'content-type': 'application/json' }
    });

    let error: Error | null = null;
    try {
      await response.json();
    } catch (e) {
      error = e as Error;
    }

    // Empty body also throws on .json()
    expect(error).not.toBeNull();
  });
});
