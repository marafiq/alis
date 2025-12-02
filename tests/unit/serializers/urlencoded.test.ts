import { describe, expect, it } from 'vitest';
import { serialize } from '../../../src/serializers/urlencoded.js';

describe('serializers/urlencoded', () => {
  it('converts objects to query strings', () => {
    const { body, contentType } = serialize({
      foo: 'bar',
      numbers: [1, 2],
      skip: null,
      truthy: true
    });

    expect(body).toContain('foo=bar');
    expect(body).toContain('numbers=1');
    expect(body).toContain('numbers=2');
    expect(body).toContain('truthy=true');
    expect(body).not.toContain('skip');
    expect(contentType).toBe('application/x-www-form-urlencoded');
  });
});

