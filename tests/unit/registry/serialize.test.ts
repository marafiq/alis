import { afterEach, describe, expect, it } from 'vitest';
import { clearSerializers, getSerializer, listSerializers, registerSerializer } from '../../../src/registry/serialize.js';

describe('registry/serialize', () => {
  afterEach(() => {
    clearSerializers();
  });

  it('exposes built-in serializers', () => {
    expect(listSerializers()).toEqual(['json', 'formdata', 'urlencoded']);
    expect(typeof getSerializer('json')).toBe('function');
  });

  it('allows custom serializer registration', () => {
    const custom = () => ({ body: 'hi', contentType: 'text/plain' });
    registerSerializer('text', custom);
    expect(getSerializer('text')).toBe(custom);
  });

  it('throws on unknown serializer', () => {
    expect(() => getSerializer('missing')).toThrow();
  });
});

