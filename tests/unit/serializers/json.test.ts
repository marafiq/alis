import { describe, expect, it } from 'vitest';
import { serialize } from '../../../src/serializers/json.js';

describe('serializers/json', () => {
  it('serializes objects into JSON strings', () => {
    const result = serialize({ foo: 'bar' });
    expect(result.body).toBe('{"foo":"bar"}');
    expect(result.contentType).toBe('application/json');
  });

  it('handles undefined data gracefully', () => {
    const result = serialize(undefined);
    expect(result.body).toBeUndefined();
  });
});

