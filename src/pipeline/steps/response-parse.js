import { isProblemDetails, parseProblemDetails } from '../../validation/problem-details.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export async function responseParseStep(ctx) {
  if (!ctx.response) {
    throw new Error('responseParseStep: missing response');
  }

  const contentType = ctx.response.headers.get('content-type') || '';
  const clone = ctx.response.clone();

  if (contentType.includes('application/json')) {
    ctx.body = await clone.json();
    if (isProblemDetails(ctx.body)) {
      ctx.validation = parseProblemDetails(ctx.body);
    }
  } else if (contentType.includes('text/')) {
    ctx.body = await clone.text();
  } else {
    ctx.body = await clone.arrayBuffer();
  }

  return ctx;
}

