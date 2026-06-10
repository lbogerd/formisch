import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';

describe('initializeFieldStore', () => {
  describe('value fields', () => {
    test('should initialize with correct properties', () => {
      const store = createTestStore({ initialInput: { name: 'John' } });
      const field = store.children.name;
      expect(field.kind).toBe('value');
      expect(field.name).toBe('["name"]');
      expect(field.input.value).toBe('John');
      expect(field.initialInput.value).toBe('John');
      expect(field.startInput.value).toBe('John');
      expect(field.errors.value).toBeNull();
      expect(field.isTouched.value).toBe(false);
      expect(field.isDirty.value).toBe(false);
      expect(field.elements).toStrictEqual([]);
      expect(field.initialElements).toBe(field.elements);
    });

    test('should initialize with undefined input', () => {
      const store = createTestStore({ initialInput: { name: undefined } });
      expect(store.children.name.kind).toBe('value');
      expect(store.children.name.input.value).toBeUndefined();
    });

    test('should initialize with null input', () => {
      const store = createTestStore({ initialInput: { name: null } });
      expect(store.children.name.kind).toBe('value');
      expect(store.children.name.input.value).toBeNull();
    });

    test('should initialize with Date input', () => {
      const date = new Date();
      const store = createTestStore({ initialInput: { createdAt: date } });
      expect(store.children.createdAt.kind).toBe('value');
      expect(store.children.createdAt.input.value).toBe(date);
    });

    test('should initialize with File input', () => {
      const file = new File(['content'], 'avatar.png');
      const store = createTestStore({ initialInput: { avatar: file } });
      expect(store.children.avatar.kind).toBe('value');
      expect(store.children.avatar.input.value).toBe(file);
    });

    test('should initialize nullish sub-object as value field', () => {
      const store = createTestStore({
        initialInput: { user: null, profile: undefined },
      });
      expect(store.children.user.kind).toBe('value');
      expect(store.children.user.input.value).toBeNull();
      expect(store.children.profile.kind).toBe('value');
      expect(store.children.profile.input.value).toBeUndefined();
    });
  });

  describe('object fields', () => {
    test('should initialize with children for each key', () => {
      const store = createTestStore({
        initialInput: { a: undefined, b: undefined },
      });
      expect(store.kind).toBe('object');
      expect(store.name).toBe('[]');
      expect(store.children).toHaveProperty('a');
      expect(store.children).toHaveProperty('b');
    });

    test('should initialize nested object', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John' } },
      });
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.name).toBe('["user"]');
        expect(userStore.children.name.kind).toBe('value');
        expect(userStore.children.name.name).toBe('["user","name"]');
        expect(userStore.children.name.input.value).toBe('John');
      }
    });

    test('should initialize empty object without children', () => {
      const store = createTestStore({ initialInput: { user: {} } });
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.children).toStrictEqual({});
      }
    });

    test('should set input to true for object fields', () => {
      const store = createTestStore({ initialInput: { user: {} } });
      const userStore = store.children.user;
      expect(userStore.input.value).toBe(true);
      expect(userStore.initialInput.value).toBe(true);
      expect(userStore.startInput.value).toBe(true);
    });
  });

  describe('array fields', () => {
    test('should initialize with children for each item', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.children).toHaveLength(2);
        expect(itemsStore.children[0].kind).toBe('value');
        expect(itemsStore.children[0].name).toBe('["items",0]');
        expect(itemsStore.children[0].input.value).toBe('a');
        expect(itemsStore.children[1].input.value).toBe('b');
      }
    });

    test('should initialize items with unique IDs for each child', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.items.value).toStrictEqual(['id-0', 'id-1']);
        expect(itemsStore.initialItems.value).toStrictEqual(['id-0', 'id-1']);
        expect(itemsStore.startItems.value).toStrictEqual(['id-0', 'id-1']);
      }
    });

    test('should initialize empty array', () => {
      const store = createTestStore({ initialInput: { items: [] } });
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.children).toHaveLength(0);
        expect(itemsStore.items.value).toHaveLength(0);
      }
    });

    test('should set input to true for array fields', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });
      const itemsStore = store.children.items;
      expect(itemsStore.input.value).toBe(true);
      expect(itemsStore.initialInput.value).toBe(true);
      expect(itemsStore.startInput.value).toBe(true);
    });
  });

  describe('nested mixed structures', () => {
    test('should initialize objects inside arrays', () => {
      const store = createTestStore({
        initialInput: { users: [{ name: 'John' }] },
      });
      const usersStore = store.children.users;
      expect(usersStore.kind).toBe('array');
      if (usersStore.kind === 'array') {
        const userStore = usersStore.children[0];
        expect(userStore.kind).toBe('object');
        if (userStore.kind === 'object') {
          expect(userStore.name).toBe('["users",0]');
          expect(userStore.children.name.name).toBe('["users",0,"name"]');
          expect(userStore.children.name.input.value).toBe('John');
        }
      }
    });

    test('should initialize arrays inside objects inside arrays', () => {
      const store = createTestStore({
        initialInput: { users: [{ tags: ['x', 'y'] }] },
      });
      const usersStore = store.children.users;
      expect(usersStore.kind).toBe('array');
      if (usersStore.kind === 'array') {
        const userStore = usersStore.children[0];
        expect(userStore.kind).toBe('object');
        if (userStore.kind === 'object') {
          const tagsStore = userStore.children.tags;
          expect(tagsStore.kind).toBe('array');
          if (tagsStore.kind === 'array') {
            expect(tagsStore.children).toHaveLength(2);
            expect(tagsStore.children[0].name).toBe('["users",0,"tags",0]');
            expect(tagsStore.children[1].input.value).toBe('y');
          }
        }
      }
    });

    test('should initialize nested arrays', () => {
      const store = createTestStore({
        initialInput: { matrix: [['a'], ['b', 'c']] },
      });
      const matrixStore = store.children.matrix;
      expect(matrixStore.kind).toBe('array');
      if (matrixStore.kind === 'array') {
        expect(matrixStore.children).toHaveLength(2);
        const rowStore = matrixStore.children[1];
        expect(rowStore.kind).toBe('array');
        if (rowStore.kind === 'array') {
          expect(rowStore.children).toHaveLength(2);
          expect(rowStore.children[1].name).toBe('["matrix",1,1]');
          expect(rowStore.children[1].input.value).toBe('c');
        }
      }
    });
  });
});
