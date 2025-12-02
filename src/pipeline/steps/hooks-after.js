import { emit } from '../../telemetry/emitter.js';

/**
 * @param {import('../context.js').PipelineContext} ctx
 */
export async function hooksAfterStep(ctx) {
  if (!ctx.config.onAfter) {
    return ctx;
  }

  emit('hooks:after:start', { id: ctx.id });

  const handlers = Array.isArray(ctx.config.onAfter)
    ? ctx.config.onAfter
    : [ctx.config.onAfter];

  for (const handler of handlers) {
    if (typeof handler === 'function') {
      // eslint-disable-next-line no-await-in-loop
      await handler(ctx);
    }
  }

  emit('hooks:after:complete', { id: ctx.id });
  return ctx;
}

