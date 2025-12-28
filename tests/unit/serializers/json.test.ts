import { describe, expect, it } from 'vitest';
import { serialize } from '../../../src/serializers/json.js';

describe('serializers/json', () => {
  it('serializes object to JSON string', () => {
    const result = serialize({ foo: 'bar' });
    expect(result.body).toBe('{"foo":"bar"}');
    expect(result.contentType).toBe('application/json');
  });

  it('serializes nested objects', () => {
    const result = serialize({
      user: { name: 'John', email: 'john@example.com' }
    });
    expect(result.body).toBe('{"user":{"name":"John","email":"john@example.com"}}');
  });

  it('serializes arrays', () => {
    const result = serialize({ tags: ['a', 'b', 'c'] });
    expect(result.body).toBe('{"tags":["a","b","c"]}');
  });

  it('serializes empty object', () => {
    const result = serialize({});
    expect(result.body).toBe('{}');
  });
});
