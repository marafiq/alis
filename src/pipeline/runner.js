import { emit } from '../telemetry/emitter.js';

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
      emit('pipeline:error', { id: currentContext.id, error });
      // Do not throw; continue to allow cleanup steps to run.
      // Steps should guard themselves against existing errors if they require success.
    }
  }

  emit('pipeline:complete', { id: currentContext.id });
  return currentContext;
}

