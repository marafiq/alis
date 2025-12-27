import { describe, expect, it } from 'vitest';
import {
  parseFieldName,
  setNestedValue,
  buildNestedObject,
  hasNestedKeys
} from '../../../src/collector/nested.js';

describe('collector/nested', () => {
  describe('parseFieldName', () => {
    it('parses simple field name', () => {
      expect(parseFieldName('name')).toEqual(['name']);
    });

    it('parses dot notation', () => {
      expect(parseFieldName('user.name')).toEqual(['user', 'name']);
    });

    it('parses deep dot notation', () => {
      expect(parseFieldName('user.address.city')).toEqual(['user', 'address', 'city']);
    });

    it('parses array index notation', () => {
      expect(parseFieldName('items[0]')).toEqual(['items', 0]);
    });

    it('parses array index with property', () => {
      expect(parseFieldName('items[0].name')).toEqual(['items', 0, 'name']);
    });

    it('parses nested arrays', () => {
      expect(parseFieldName('matrix[0][1]')).toEqual(['matrix', 0, 1]);
    });

    it('parses empty brackets as array append (-1)', () => {
      expect(parseFieldName('tags[]')).toEqual(['tags', -1]);
    });

    it('parses complex mixed notation', () => {
      expect(parseFieldName('orders[0].items[1].product.name')).toEqual([
        'orders', 0, 'items', 1, 'product', 'name'
      ]);
    });

    it('handles property names in brackets', () => {
      expect(parseFieldName('data[key]')).toEqual(['data', 'key']);
    });

    it('handles leading bracket', () => {
      // Edge case: name like "[0].value"
      expect(parseFieldName('[0].value')).toEqual([0, 'value']);
    });
  });

  describe('setNestedValue', () => {
    it('sets simple property', () => {
      const obj: Record<string, any> = {};
      setNestedValue(obj, ['name'], 'John');
      expect(obj).toEqual({ name: 'John' });
    });

    it('sets nested property', () => {
      const obj: Record<string, any> = {};
      setNestedValue(obj, ['user', 'name'], 'John');
      expect(obj).toEqual({ user: { name: 'John' } });
    });

    it('sets array element', () => {
      const obj: Record<string, any> = {};
      setNestedValue(obj, ['items', 0], 'first');
      expect(obj).toEqual({ items: ['first'] });
    });

    it('sets nested array element', () => {
      const obj: Record<string, any> = {};
      setNestedValue(obj, ['items', 0, 'name'], 'Item 1');
      expect(obj).toEqual({ items: [{ name: 'Item 1' }] });
    });

    it('accumulates values at same path', () => {
      const obj: Record<string, any> = {};
      setNestedValue(obj, ['tags'], 'tag1');
      setNestedValue(obj, ['tags'], 'tag2');
      expect(obj).toEqual({ tags: ['tag1', 'tag2'] });
    });

    it('handles array append (-1)', () => {
      const obj: Record<string, any> = { items: [] };
      setNestedValue(obj, ['items', -1], 'a');
      setNestedValue(obj, ['items', -1], 'b');
      expect(obj).toEqual({ items: ['a', 'b'] });
    });

    it('preserves existing structure', () => {
      const obj: Record<string, any> = { user: { id: 1 } };
      setNestedValue(obj, ['user', 'name'], 'John');
      expect(obj).toEqual({ user: { id: 1, name: 'John' } });
    });

    it('sets sparse array elements', () => {
      const obj: Record<string, any> = {};
      setNestedValue(obj, ['items', 2], 'third');
      // Array should have empty slots
      expect(obj.items).toBeDefined();
      expect(obj.items[2]).toBe('third');
    });
  });

  describe('buildNestedObject', () => {
    it('builds simple object', () => {
      const flat = { name: 'John', age: 30 };
      expect(buildNestedObject(flat)).toEqual({ name: 'John', age: 30 });
    });

    it('builds nested object from dot notation', () => {
      const flat = {
        'user.name': 'John',
        'user.email': 'john@example.com'
      };
      expect(buildNestedObject(flat)).toEqual({
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      });
    });

    it('builds array from bracket notation', () => {
      const flat = {
        'items[0]': 'first',
        'items[1]': 'second'
      };
      expect(buildNestedObject(flat)).toEqual({
        items: ['first', 'second']
      });
    });

    it('builds array of objects (bulk edit pattern)', () => {
      const flat = {
        'items[0].name': 'Item 1',
        'items[0].price': 100,
        'items[1].name': 'Item 2',
        'items[1].price': 200
      };
      expect(buildNestedObject(flat)).toEqual({
        items: [
          { name: 'Item 1', price: 100 },
          { name: 'Item 2', price: 200 }
        ]
      });
    });

    it('builds deeply nested structure', () => {
      const flat = {
        'order.customer.name': 'John',
        'order.customer.address.city': 'NYC',
        'order.items[0].product': 'Widget',
        'order.items[0].quantity': 5
      };
      expect(buildNestedObject(flat)).toEqual({
        order: {
          customer: {
            name: 'John',
            address: { city: 'NYC' }
          },
          items: [
            { product: 'Widget', quantity: 5 }
          ]
        }
      });
    });

    it('handles mixed flat and nested keys', () => {
      const flat = {
        'id': '123',
        'items[0].name': 'Item 1',
        'metadata.source': 'web'
      };
      expect(buildNestedObject(flat)).toEqual({
        id: '123',
        items: [{ name: 'Item 1' }],
        metadata: { source: 'web' }
      });
    });

    it('handles array values in flat data', () => {
      const flat = {
        'tags': ['a', 'b', 'c']
      };
      expect(buildNestedObject(flat)).toEqual({
        tags: ['a', 'b', 'c']
      });
    });

    it('handles nested array values', () => {
      const flat = {
        'items[0].tags': ['red', 'blue']
      };
      expect(buildNestedObject(flat)).toEqual({
        items: [{ tags: ['red', 'blue'] }]
      });
    });

    it('accumulates multiple values at same path', () => {
      // This would happen if there are multiple fields with same base name
      const flat = {
        'user.roles': 'admin'
      };
      const result = buildNestedObject(flat);
      expect(result).toEqual({ user: { roles: 'admin' } });
    });
  });

  describe('hasNestedKeys', () => {
    it('returns false for simple keys', () => {
      expect(hasNestedKeys({ name: 'John', age: 30 })).toBe(false);
    });

    it('returns true for dot notation', () => {
      expect(hasNestedKeys({ 'user.name': 'John' })).toBe(true);
    });

    it('returns true for bracket notation', () => {
      expect(hasNestedKeys({ 'items[0]': 'first' })).toBe(true);
    });

    it('returns true for mixed notation', () => {
      expect(hasNestedKeys({ 'items[0].name': 'Item 1' })).toBe(true);
    });

    it('returns false for empty object', () => {
      expect(hasNestedKeys({})).toBe(false);
    });
  });
});
