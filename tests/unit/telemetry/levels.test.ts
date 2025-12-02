import { describe, expect, it } from 'vitest';
import { EVENT_LEVELS, getEventLevel, LEVELS, shouldLog } from '../../../src/telemetry/levels.js';

describe('telemetry/levels', () => {
  it('maps known events to explicit levels', () => {
    expect(getEventLevel('request:retry')).toBe('warn');
    expect(getEventLevel('validate:error')).toBe('error');
    expect(getEventLevel('unknown:event')).toBe('info');
  });

  it('allows overrides', () => {
    expect(getEventLevel('custom', { custom: 'debug' })).toBe('debug');
  });

  it('determines logging eligibility using severity ordering', () => {
    expect(shouldLog('debug', 'info')).toBe(true);
    expect(shouldLog('warn', 'info')).toBe(false);
    expect(shouldLog('none', 'error')).toBe(false);
    expect(LEVELS.error).toBe(1);
  });
});

