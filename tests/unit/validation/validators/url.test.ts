import { describe, expect, it } from 'vitest';
import { validate } from '../../../../src/validation/validators/url.js';

describe('url validator', () => {
  const input = document.createElement('input');
  const params = { message: 'Invalid URL' };

  it('returns invalid for non-URL string', () => {
    const result = validate('not a url', params, input);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Invalid URL');
  });

  it('returns valid for http URL', () => {
    const result = validate('http://example.com', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for https URL', () => {
    const result = validate('https://example.com', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for URL with path', () => {
    const result = validate('https://example.com/path/to/page', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns valid for empty value', () => {
    const result = validate('', params, input);
    expect(result.isValid).toBe(true);
  });

  it('returns invalid for missing protocol', () => {
    const result = validate('example.com', params, input);
    expect(result.isValid).toBe(false);
  });
});

