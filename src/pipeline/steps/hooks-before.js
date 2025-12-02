import { emit } from '../../telemetry/emitter.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export async function hooksBeforeStep(ctx) {
  if (!ctx.config.onBefore) {
    return ctx;
  }

  emit('hooks:before:start', { id: ctx.id });

  const handlers = Array.isArray(ctx.config.onBefore)
    ? ctx.config.onBefore
    : [ctx.config.onBefore];

  for (const handler of handlers) {
    if (typeof handler === 'function') {
      // eslint-disable-next-line no-await-in-loop
      const result = await handler(ctx);
      if (result === false) {
        ctx.state.aborted = true;
        break;
      }
    }
  }

  emit('hooks:before:complete', { id: ctx.id });
  return ctx;
}

