import { describe, expect, it } from 'vitest';
import { serialize as serializeFormData } from '../../../src/serializers/formdata.js';
import { serialize as serializeUrlencoded } from '../../../src/serializers/urlencoded.js';
import { serialize as serializeJson } from '../../../src/serializers/json.js';

describe('Serializer: nested objects with dot notation', () => {
  it('formdata should flatten nested objects with dot notation', () => {
    const data = {
      user: {
        name: 'John',
        email: 'john@example.com'
      }
    };

    const result = serializeFormData(data);
    const formData = result.body;

    // FIXED: Now uses dot notation for ASP.NET Core model binding
    expect(formData.get('user.name')).toBe('John');
    expect(formData.get('user.email')).toBe('john@example.com');
  });

  it('urlencoded should flatten nested objects with dot notation', () => {
    const data = {
      user: {
        name: 'John',
        email: 'john@example.com'
      }
    };

    const result = serializeUrlencoded(data);

    // FIXED: Now uses dot notation
    expect(result.body).toContain('user.name=John');
    expect(result.body).toContain('user.email=john%40example.com');
  });

  it('formdata should handle deeply nested objects', () => {
    const data = {
      order: {
        customer: {
          address: {
            city: 'Seattle'
          }
        }
      }
    };

    const result = serializeFormData(data);
    expect(result.body.get('order.customer.address.city')).toBe('Seattle');
  });

  it('formdata should handle simple arrays with repeated keys', () => {
    const data = {
      items: ['apple', 'banana', 'cherry']
    };

    const result = serializeFormData(data);
    // Simple arrays use repeated keys (standard HTML form behavior)
    expect(result.body.getAll('items')).toEqual(['apple', 'banana', 'cherry']);
  });

  it('formdata should handle array of objects', () => {
    const data = {
      users: [
        { name: 'John' },
        { name: 'Jane' }
      ]
    };

    const result = serializeFormData(data);
    expect(result.body.get('users[0].name')).toBe('John');
    expect(result.body.get('users[1].name')).toBe('Jane');
  });
});

describe('Serializer: known limitations', () => {
  it('json throws on circular references (documented limitation)', () => {
    const data: Record<string, unknown> = { name: 'test' };
    data.self = data; // Circular reference

    // This is a JavaScript limitation - circular refs cannot be JSON serialized
    expect(() => serializeJson(data)).toThrow();
  });
});

describe('Serializer stability: special values', () => {
  it('formdata should handle boolean values', () => {
    const data = { active: true, disabled: false };
    const result = serializeFormData(data);

    // Booleans become "true"/"false" strings
    expect(result.body.get('active')).toBe('true');
    expect(result.body.get('disabled')).toBe('false');
  });

  it('formdata should handle number values', () => {
    const data = { count: 42, price: 19.99 };
    const result = serializeFormData(data);

    expect(result.body.get('count')).toBe('42');
    expect(result.body.get('price')).toBe('19.99');
  });

  it('urlencoded should handle special characters', () => {
    const data = { query: 'hello world', symbol: '&=?' };
    const result = serializeUrlencoded(data);

    // Should be properly encoded
    expect(result.body).toContain('hello+world');
    expect(result.body).not.toContain('&&');
  });

  it('formdata should handle Date objects', () => {
    const data = { createdAt: new Date('2024-01-15') };
    const result = serializeFormData(data);

    // Date becomes string representation
    const dateValue = result.body.get('createdAt');
    expect(dateValue).toContain('2024');
  });
});
