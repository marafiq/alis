import { emit, startSpan, endSpan } from '../telemetry/emitter.js';

/**
 * @typedef {import('./context.js').PipelineContext} PipelineContext
 */

/**
 * @param {PipelineContext} context
 * @param {Array<(ctx: PipelineContext) => Promise<PipelineContext> | PipelineContext>} steps
 * @returns {Promise<PipelineContext>}
 */
export async function runPipeline(context, steps = []) {
  let currentContext = context;
  const pipelineSpan = startSpan('pipeline', {
    id: currentContext.id,
    url: currentContext.config?.url,
    method: currentContext.config?.method
  });

  for (const step of steps) {
    if (currentContext.state.aborted) {
      emit('pipeline:aborted', { id: currentContext.id });
      break;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      currentContext = await step(currentContext);
    } catch (error) {
      currentContext.error = error instanceof Error ? error : new Error(String(error));
      emit('pipeline:error', {
        id: currentContext.id,
        error: currentContext.error.message,
        stack: currentContext.error.stack
      });
      // Do not throw; continue to allow cleanup steps to run.
      // Steps should guard themselves against existing errors if they require success.
    }
  }

  endSpan(pipelineSpan, {
    success: !currentContext.error,
    aborted: currentContext.state.aborted,
    status: currentContext.response?.status
  });
  return currentContext;
}

