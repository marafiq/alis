/**
 * @param {() => Promise<Response>} operation
 * @param {import('../pipeline/context.js').PipelineContext} ctx
 * @param {{ maxAttempts?: number; statusCodes?: number[]; calculateDelay?: (attempt: number, policy: any) => number }} policy
 */
export async function executeWithRetry(operation, ctx, policy) {
  const maxAttempts = policy.maxAttempts ?? 1;
  const retryStatuses = policy.statusCodes ?? [];

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    ctx.state.attempts = attempt;
    try {
      const response = await operation();
      // If status is not retryable, return immediately (success or non-retryable error)
      if (!retryStatuses.includes(response.status)) {
        return response;
      }
      // If this is the last attempt and we got a retryable status, throw
      if (attempt === maxAttempts) {
        throw new Error(`Request failed with status ${response.status} after ${maxAttempts} attempts`);
      }
      lastError = new Error(`Retryable status ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        break;
      }
    }

    const delay = policy.calculateDelay ? policy.calculateDelay(attempt, policy) : 0;
    if (delay > 0) {
      await wait(delay);
    }
  }

  throw lastError || new Error('Retry attempts exhausted');
}

/**
 * @param {number} ms
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

