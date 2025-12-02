import { describe, expect, it } from 'vitest';
import { isProblemDetails, parseProblemDetails } from '../../../src/validation/problem-details.js';

describe('validation/problem-details', () => {
  it('detects problem details structure', () => {
    expect(isProblemDetails({ title: 'Error' })).toBe(true);
    expect(isProblemDetails('nope')).toBe(false);
  });

  it('normalizes errors as arrays', () => {
    const details = parseProblemDetails({
      title: 'Invalid',
      errors: {
        email: ['Required'],
        name: 'Too short'
      }
    });

    const parsed = details as any;
    expect(parsed.errors.email).toEqual(['Required']);
    expect(parsed.errors.name).toEqual(['Too short']);
  });
});

