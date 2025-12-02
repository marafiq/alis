import { describe, expect, it, vi } from 'vitest';
import { handleError } from '../../../src/errors/strategy.js';
import { ALISError } from '../../../src/errors/types.js';

describe('errors/strategy', () => {
  it('throws by default and logs to logger', () => {
    const logger = { error: vi.fn() };
    expect(() => handleError(new ALISError('fail'), {}, logger)).toThrow();
    expect(logger.error).toHaveBeenCalledWith('[ALIS] fail', expect.any(ALISError));
  });

  it('suppresses when behavior is suppress', () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const result = handleError(new Error('warn me'), { behavior: 'suppress', level: 'warn' }, logger);
    expect(result).toBeInstanceOf(Error);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('normalizes non-error inputs', () => {
    const logger = { error: vi.fn() };
    expect(() => handleError('string boom', {}, logger)).toThrow(ALISError);
    expect(logger.error).toHaveBeenCalled();
  });

  it('invokes onError callback and swallows its failure', () => {
    const logger = { error: vi.fn() };
    const hook = vi.fn(() => {
      throw new Error('hook fail');
    });
    expect(() => handleError(new Error('fail'), { onError: hook }, logger)).toThrow();
    expect(hook).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('[ALIS] fail', expect.any(Error));
  });
});

