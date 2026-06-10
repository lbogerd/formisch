import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { getFieldStore } from './getFieldStore.ts';

describe('getFieldStore', () => {
  describe('existing paths', () => {
    test('should return root store for empty path', () => {
      const store = createTestStore({ initialInput: { name: undefined } });
      expect(getFieldStore(store, [])).toBe(store);
    });

    test('should return child store for single-key path', () => {
      const store = createTestStore({ initialInput: { name: undefined } });
      expect(getFieldStore(store, ['name'])).toBe(store.children.name);
    });

    test('should return nested store for multi-key path', () => {
      const store = createTestStore({
        initialInput: { user: { name: undefined } },
      });
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(getFieldStore(store, ['user', 'name'])).toBe(
          userStore.children.name
        );
      }
    });

    test('should return array item store', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(getFieldStore(store, ['items', 0])).toBe(itemsStore.children[0]);
        expect(getFieldStore(store, ['items', 1])).toBe(itemsStore.children[1]);
      }
    });

    test('should return deeply nested array item store', () => {
      const store = createTestStore({
        initialInput: { users: [{ name: 'John' }] },
      });
      const usersStore = store.children.users;
      expect(usersStore.kind).toBe('array');
      if (usersStore.kind === 'array') {
        const userStore = usersStore.children[0];
        expect(userStore.kind).toBe('object');
        if (userStore.kind === 'object') {
          expect(getFieldStore(store, ['users', 0, 'name'])).toBe(
            userStore.children.name
          );
        }
      }
    });
  });

  describe('lazy creation', () => {
    test('should create missing field store for string key', () => {
      const store = createTestStore();
      const field = getFieldStore(store, ['name']);
      expect(field.kind).toBe('value');
      expect(field.name).toBe('["name"]');
      expect(field.input.value).toBeUndefined();
      expect(field.errors.value).toBeNull();
      expect(store.children.name).toBe(field);
    });

    test('should create deep missing path with object parents', () => {
      const store = createTestStore();
      const field = getFieldStore(store, ['user', 'address', 'city']);
      expect(field.kind).toBe('value');
      expect(field.name).toBe('["user","address","city"]');
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.name).toBe('["user"]');
        const addressStore = userStore.children.address;
        expect(addressStore.kind).toBe('object');
        if (addressStore.kind === 'object') {
          expect(addressStore.children.city).toBe(field);
        }
      }
    });

    test('should upgrade parent to array for number key', () => {
      const store = createTestStore();
      const field = getFieldStore(store, ['items', 0]);
      expect(field.kind).toBe('value');
      expect(field.name).toBe('["items",0]');
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.children[0]).toBe(field);
      }
    });

    test('should mark object container as present when child is created', () => {
      const store = createTestStore();
      getFieldStore(store, ['user', 'name']);
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.initialInput.value).toBe(true);
        expect(userStore.startInput.value).toBe(true);
        expect(userStore.input.value).toBe(true);
      }
    });

    test('should upgrade nullish field store while traversing', () => {
      const store = createTestStore({ initialInput: { user: null } });
      const field = getFieldStore(store, ['user', 'name']);
      expect(field.kind).toBe('value');
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.input.value).toBeNull();
        expect(userStore.children.name).toBe(field);
      }
    });
  });

  describe('kind hint', () => {
    test('should upgrade leaf to array with "array" kind', () => {
      const store = createTestStore({ initialInput: { items: undefined } });
      const field = getFieldStore(store, ['items'], 'array');
      expect(field).toBe(store.children.items);
      expect(field.kind).toBe('array');
      if (field.kind === 'array') {
        expect(field.children).toStrictEqual([]);
        expect(field.items.value).toStrictEqual([]);
      }
    });

    test('should upgrade leaf to object with "object" kind', () => {
      const store = createTestStore({ initialInput: { user: undefined } });
      const field = getFieldStore(store, ['user'], 'object');
      expect(field).toBe(store.children.user);
      expect(field.kind).toBe('object');
      if (field.kind === 'object') {
        expect(field.children).toStrictEqual({});
      }
    });
  });

  describe('idempotency', () => {
    test('should return same store object on repeated calls', () => {
      const store = createTestStore();
      const first = getFieldStore(store, ['user', 'name']);
      const second = getFieldStore(store, ['user', 'name']);
      expect(second).toBe(first);
    });

    test('should return same store object on repeated calls with kind', () => {
      const store = createTestStore();
      const first = getFieldStore(store, ['items'], 'array');
      const second = getFieldStore(store, ['items'], 'array');
      expect(second).toBe(first);
    });
  });

  describe('errors', () => {
    test('should throw when traversing value field with incompatible value', () => {
      const store = createTestStore({ initialInput: { name: 'John' } });
      expect(() => getFieldStore(store, ['name', 'first'])).toThrow(
        'Field store "["name"]" holds an incompatible value and cannot be accessed as "object"'
      );
    });

    test('should throw when traversing object field with number key', () => {
      const store = createTestStore({ initialInput: { user: {} } });
      expect(() => getFieldStore(store, ['user', 0])).toThrow(
        'Field store "["user"]" initialized as "object" cannot be accessed as "array"'
      );
    });

    test('should throw when traversing array field with string key', () => {
      const store = createTestStore({ initialInput: { items: [] } });
      expect(() => getFieldStore(store, ['items', 'name'])).toThrow(
        'Field store "["items"]" initialized as "array" cannot be accessed as "object"'
      );
    });
  });
});
