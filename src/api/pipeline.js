import { runPipeline } from '../pipeline/runner.js';
import { validateStep } from '../pipeline/steps/validate.js';
import { confirmStep } from '../pipeline/steps/confirm.js';
import { coordinateStep, coordinateCleanupStep } from '../pipeline/steps/coordinate.js';
import { stateCaptureStep } from '../pipeline/steps/state-capture.js';
import { stateApplyStep } from '../pipeline/steps/state-apply.js';
import { hooksBeforeStep } from '../pipeline/steps/hooks-before.js';
import { collectStep } from '../pipeline/steps/collect.js';
import { clientValidationStep } from '../pipeline/steps/client-validation.js';
import { requestBuildStep } from '../pipeline/steps/request-build.js';
import { requestExecuteStep } from '../pipeline/steps/request-execute.js';
import { responseParseStep } from '../pipeline/steps/response-parse.js';
import { responseRouteStep } from '../pipeline/steps/response-route.js';
import { validationDisplayStep } from '../pipeline/steps/validation-display.js';
import { swapStep } from '../pipeline/steps/swap.js';
import { stateRestoreStep } from '../pipeline/steps/state-restore.js';
import { hooksAfterStep } from '../pipeline/steps/hooks-after.js';
import { focusStep } from '../pipeline/steps/focus.js';

export const DEFAULT_STEPS = [
  validateStep,
  confirmStep,
  coordinateStep,
  collectStep,         // Collect BEFORE state changes (element might get disabled)
  stateCaptureStep,
  stateApplyStep,
  hooksBeforeStep,
  clientValidationStep, // Client-side validation after hooks-before, before request
  requestBuildStep,
  requestExecuteStep,
  responseParseStep,
  responseRouteStep,
  validationDisplayStep,
  swapStep,
  stateRestoreStep,
  hooksAfterStep,
  focusStep,           // Focus restoration as final user-facing step
  coordinateCleanupStep
];

/**
 * @param {import('../pipeline/context.js').PipelineContext} ctx
 */
export async function runDefaultPipeline(ctx) {
  const result = await runPipeline(ctx, DEFAULT_STEPS);
  // Re-throw if there was an error so callers can catch it
  if (result.error) {
    throw result.error;
  }
  return result;
}

