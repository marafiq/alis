import { runPipeline } from '../pipeline/runner.js';
import { validateStep } from '../pipeline/steps/validate.js';
import { confirmStep } from '../pipeline/steps/confirm.js';
import { coordinateStep } from '../pipeline/steps/coordinate.js';
import { stateCaptureStep } from '../pipeline/steps/state-capture.js';
import { stateApplyStep } from '../pipeline/steps/state-apply.js';
import { hooksBeforeStep } from '../pipeline/steps/hooks-before.js';
import { collectStep } from '../pipeline/steps/collect.js';
import { requestBuildStep } from '../pipeline/steps/request-build.js';
import { requestExecuteStep } from '../pipeline/steps/request-execute.js';
import { responseParseStep } from '../pipeline/steps/response-parse.js';
import { responseRouteStep } from '../pipeline/steps/response-route.js';
import { validationDisplayStep } from '../pipeline/steps/validation-display.js';
import { swapStep } from '../pipeline/steps/swap.js';
import { stateRestoreStep } from '../pipeline/steps/state-restore.js';
import { hooksAfterStep } from '../pipeline/steps/hooks-after.js';

export const DEFAULT_STEPS = [
  validateStep,
  confirmStep,
  coordinateStep,
  stateCaptureStep,
  stateApplyStep,
  hooksBeforeStep,
  collectStep,
  requestBuildStep,
  requestExecuteStep,
  responseParseStep,
  responseRouteStep,
  validationDisplayStep,
  swapStep,
  stateRestoreStep,
  hooksAfterStep
];

/**
 * @param {import('../pipeline/context.js').PipelineContext} ctx
 */
export function runDefaultPipeline(ctx) {
  return runPipeline(ctx, DEFAULT_STEPS);
}

