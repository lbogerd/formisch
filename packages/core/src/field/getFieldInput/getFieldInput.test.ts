import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { getFieldInput } from './getFieldInput.ts';

describe('getFieldInput', () => {
  describe('value fields', () => {
    test('should return string value', () => {
      const store = createTestStore({ initialInput: { name: 'John' } });
      expect(getFieldInput(store.children.name)).toBe('John');
    });

    test('should return number value', () => {
      const store = createTestStore({ initialInput: { age: 25 } });
      expect(getFieldInput(store.children.age)).toBe(25);
    });

    test('should return undefined for uninitialized field', () => {
      const store = createTestStore({ initialInput: { name: undefined } });
      expect(getFieldInput(store.children.name)).toBeUndefined();
    });

    test('should return null for nullish field', () => {
      const store = createTestStore({ initialInput: { user: null } });
      expect(store.children.user.kind).toBe('value');
      expect(getFieldInput(store.children.user)).toBeNull();
    });
  });

  describe('object fields', () => {
    test('should collect input from all children', () => {
      const store = createTestStore({
        initialInput: { name: 'John', age: 25 },
      });
      expect(getFieldInput(store)).toStrictEqual({ name: 'John', age: 25 });
    });

    test('should return null for nullish object input', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John' } },
      });
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        userStore.input.value = null;
      }
      expect(getFieldInput(userStore)).toBeNull();
    });

    test('should return undefined for undefined object input', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John' } },
      });
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        userStore.input.value = undefined;
      }
      expect(getFieldInput(userStore)).toBeUndefined();
    });
  });

  describe('array fields', () => {
    test('should collect input from all items', () => {
      const store = createTestStore({
        initialInput: { items: ['a', 'b', 'c'] },
      });
      expect(getFieldInput(store.children.items)).toStrictEqual([
        'a',
        'b',
        'c',
      ]);
    });

    test('should return empty array for empty array input', () => {
      const store = createTestStore({ initialInput: { items: [] } });
      expect(getFieldInput(store.children.items)).toStrictEqual([]);
    });

    test('should return null for nullish array input', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        itemsStore.input.value = null;
      }
      expect(getFieldInput(itemsStore)).toBeNull();
    });
  });

  describe('nested structures', () => {
    test('should collect deeply nested input', () => {
      const store = createTestStore({
        initialInput: {
          users: [
            { name: 'John', age: 25 },
            { name: 'Jane', age: 30 },
          ],
        },
      });
      expect(getFieldInput(store)).toStrictEqual({
        users: [
          { name: 'John', age: 25 },
          { name: 'Jane', age: 30 },
        ],
      });
    });
  });
});
