import { describe, expect, it } from 'vitest';
import { responseParseStep } from '../../../../src/pipeline/steps/response-parse.js';
import { createContext } from '../../../../src/pipeline/context.js';

describe('pipeline/steps/response-parse', () => {
  it('parses JSON bodies', async () => {
    const ctx = createContext(document.createElement('div'));
    ctx.response = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await responseParseStep(ctx);
    expect(result.body).toEqual({ ok: true });
  });

  it('detects problem details payload', async () => {
    const ctx = createContext(document.createElement('div'));
    ctx.response = new Response(
      JSON.stringify({ title: 'Invalid', errors: { email: ['Required'] } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
    const result = await responseParseStep(ctx);
    const validation = result.validation as any;
    expect(validation.errors.email).toEqual(['Required']);
  });
});

