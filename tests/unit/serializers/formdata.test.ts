import { describe, expect, it } from 'vitest';
import { serialize } from '../../../src/serializers/formdata.js';

describe('serializers/formdata', () => {
  it('creates FormData for plain objects', () => {
    const { body, contentType } = serialize({ foo: 'bar', list: ['a', 'b'] });

    expect(body).toBeInstanceOf(FormData);
    expect(contentType).toBeNull();
    expect(body.getAll('list')).toEqual(['a', 'b']);
    expect(body.get('foo')).toBe('bar');
  });

  it('passes through File and Blob values', () => {
    const file = new File(['123'], 'test.txt', { type: 'text/plain' });
    const { body } = serialize({ upload: file });
    expect(body.get('upload')).toBe(file);
  });
});

