import { isProblemDetails, parseProblemDetails } from '../../validation/problem-details.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export async function responseParseStep(ctx) {
  // Skip if there's already an error (e.g., from validation) or no response
  if (ctx.error || !ctx.response) {
    return ctx;
  }

  const contentType = ctx.response.headers.get('content-type') || '';
  const clone = ctx.response.clone();

  if (contentType.includes('json')) {
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

