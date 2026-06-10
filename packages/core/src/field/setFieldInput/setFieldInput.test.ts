import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { getFieldBool } from '../getFieldBool/getFieldBool.ts';
import { getFieldInput } from '../getFieldInput/getFieldInput.ts';
import { setFieldInput } from './setFieldInput.ts';

describe('setFieldInput', () => {
  describe('value fields', () => {
    test('should set string value', () => {
      const store = createTestStore({ initialInput: { name: undefined } });
      setFieldInput(store, ['name'], 'John');
      expect(getFieldInput(store.children.name)).toBe('John');
    });

    test('should mark field as touched', () => {
      const store = createTestStore({ initialInput: { name: undefined } });
      setFieldInput(store, ['name'], 'John');
      expect(store.children.name.isTouched.value).toBe(true);
    });

    test('should mark field as dirty when value changes', () => {
      const store = createTestStore({ initialInput: { name: 'John' } });
      setFieldInput(store, ['name'], 'Jane');
      expect(store.children.name.isDirty.value).toBe(true);
    });

    test('should clear dirty state when reverting to start input', () => {
      const store = createTestStore({ initialInput: { name: 'John' } });
      setFieldInput(store, ['name'], 'Jane');
      expect(store.children.name.isDirty.value).toBe(true);
      setFieldInput(store, ['name'], 'John');
      expect(store.children.name.isDirty.value).toBe(false);
    });

    test('should not mark field as dirty for empty string from undefined', () => {
      const store = createTestStore({ initialInput: { name: undefined } });
      setFieldInput(store, ['name'], '');
      expect(store.children.name.isDirty.value).toBe(false);
    });

    test('should not mark field as dirty for NaN from undefined', () => {
      const store = createTestStore({ initialInput: { age: undefined } });
      setFieldInput(store, ['age'], NaN);
      expect(store.children.age.isDirty.value).toBe(false);
    });

    test('should not mark field as dirty for empty string from null', () => {
      const store = createTestStore({ initialInput: { name: null } });
      setFieldInput(store, ['name'], '');
      expect(store.children.name.isDirty.value).toBe(false);
    });
  });

  describe('object fields', () => {
    test('should set nested object value', () => {
      const store = createTestStore({
        initialInput: { user: { name: undefined } },
      });
      setFieldInput(store, ['user', 'name'], 'John');
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(getFieldInput(userStore.children.name)).toBe('John');
      }
    });

    test('should set object value recursively', () => {
      const store = createTestStore({
        initialInput: { user: { name: undefined, age: undefined } },
      });
      setFieldInput(store, ['user'], { name: 'John', age: 25 });
      expect(getFieldInput(store.children.user)).toStrictEqual({
        name: 'John',
        age: 25,
      });
    });

    test('should mark parent input as truthy when setting nested field', () => {
      const store = createTestStore({ initialInput: { user: null } });
      setFieldInput(store, ['user', 'name'], 'John');
      expect(store.children.user.kind).toBe('object');
      expect(store.children.user.input.value).toBe(true);
      expect(getFieldInput(store.children.user)).toStrictEqual({
        name: 'John',
      });
    });

    test('should mark parent inputs as truthy along the path', () => {
      const store = createTestStore({
        initialInput: { a: { b: { c: undefined } } },
      });
      setFieldInput(store, ['a'], null);
      expect(store.children.a.input.value).toBeNull();
      setFieldInput(store, ['a', 'b', 'c'], 'value');
      const aStore = store.children.a;
      expect(aStore.input.value).toBe(true);
      expect(aStore.kind).toBe('object');
      if (aStore.kind === 'object') {
        expect(aStore.children.b.input.value).toBe(true);
      }
    });
  });

  describe('array fields', () => {
    test('should set array item value', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });
      setFieldInput(store, ['items', 0], 'updated');
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(getFieldInput(itemsStore.children[0])).toBe('updated');
      }
    });

    test('should truncate array when setting shorter array', () => {
      const store = createTestStore({
        initialInput: { items: ['a', 'b', 'c'] },
      });
      setFieldInput(store, ['items'], ['x']);
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.items.value).toHaveLength(1);
      }
    });

    test('should keep item IDs when truncating array', () => {
      const store = createTestStore({
        initialInput: { items: ['a', 'b', 'c'] },
      });
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        const prevItems = itemsStore.items.value;
        setFieldInput(store, ['items'], ['x', 'y']);
        expect(itemsStore.items.value).toStrictEqual(prevItems.slice(0, 2));
      }
    });

    test('should extend array when setting longer array', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });
      setFieldInput(store, ['items'], ['x', 'y', 'z']);
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.items.value).toHaveLength(3);
        expect(getFieldInput(itemsStore)).toStrictEqual(['x', 'y', 'z']);
      }
    });

    test('should keep item IDs when extending array', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        const prevItems = itemsStore.items.value;
        setFieldInput(store, ['items'], ['x', 'y']);
        expect(itemsStore.items.value).toHaveLength(2);
        expect(itemsStore.items.value[0]).toBe(prevItems[0]);
      }
    });

    test('should set null for nullish array', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });
      setFieldInput(store, ['items'], null);
      expect(store.children.items.input.value).toBeNull();
    });
  });

  describe('dirty state for arrays', () => {
    test('should mark array as dirty when length changes', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });
      setFieldInput(store, ['items'], ['a']);
      expect(store.children.items.isDirty.value).toBe(true);
    });

    test('should clear array isDirty after reverting to initial input', () => {
      const store = createTestStore({
        initialInput: { items: ['a', 'b', 'c', 'd'] },
      });
      setFieldInput(store, ['items'], ['b', 'c', 'd']);
      expect(getFieldBool(store.children.items, 'isDirty')).toBe(true);
      setFieldInput(store, ['items'], ['a', 'b', 'c', 'd']);
      expect(getFieldBool(store.children.items, 'isDirty')).toBe(false);
    });

    test('should clear array isDirty after reverting from longer back to initial', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });
      setFieldInput(store, ['items'], ['a', 'b', 'c']);
      expect(getFieldBool(store.children.items, 'isDirty')).toBe(true);
      setFieldInput(store, ['items'], ['a', 'b']);
      expect(getFieldBool(store.children.items, 'isDirty')).toBe(false);
    });
  });

  describe('dirty state for objects', () => {
    test('should mark object as dirty when input becomes null', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John' } },
      });
      setFieldInput(store, ['user'], null);
      expect(store.children.user.input.value).toBeNull();
      expect(store.children.user.isDirty.value).toBe(true);
    });
  });

  describe('lazy store creation', () => {
    test('should create value store for path missing from initial input', () => {
      const store = createTestStore();
      setFieldInput(store, ['name'], 'John');
      const nameStore = store.children.name;
      expect(nameStore.kind).toBe('value');
      expect(nameStore.input.value).toBe('John');
      expect(nameStore.isTouched.value).toBe(true);
      expect(nameStore.isDirty.value).toBe(true);
    });

    test('should create nested stores for path missing from initial input', () => {
      const store = createTestStore();
      setFieldInput(store, ['user', 'name'], 'John');
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      expect(userStore.input.value).toBe(true);
      expect(getFieldInput(userStore)).toStrictEqual({ name: 'John' });
    });

    test('should create array store for numeric path key', () => {
      const store = createTestStore();
      setFieldInput(store, ['items', 0], 'a');
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.children[0].input.value).toBe('a');
      }
    });
  });

  describe('value store upgrades', () => {
    test('should upgrade value store to object store for object input', () => {
      const store = createTestStore({ initialInput: { profile: null } });
      expect(store.children.profile.kind).toBe('value');
      setFieldInput(store, ['profile'], { bio: 'Hello' });
      const profileStore = store.children.profile;
      expect(profileStore.kind).toBe('object');
      expect(profileStore.input.value).toBe(true);
      expect(profileStore.isDirty.value).toBe(true);
      if (profileStore.kind === 'object') {
        expect(profileStore.children.bio.input.value).toBe('Hello');
        expect(profileStore.children.bio.isDirty.value).toBe(true);
      }
    });

    test('should upgrade value store to array store for array input', () => {
      const store = createTestStore({ initialInput: { tags: undefined } });
      expect(store.children.tags.kind).toBe('value');
      setFieldInput(store, ['tags'], ['a', 'b']);
      const tagsStore = store.children.tags;
      expect(tagsStore.kind).toBe('array');
      expect(tagsStore.isDirty.value).toBe(true);
      if (tagsStore.kind === 'array') {
        expect(tagsStore.items.value).toHaveLength(2);
        expect(getFieldInput(tagsStore)).toStrictEqual(['a', 'b']);
      }
    });
  });

  describe('unknown object keys', () => {
    test('should create dirty children for unknown input keys', () => {
      const store = createTestStore({
        initialInput: { user: { name: undefined } },
      });
      setFieldInput(store, ['user'], {
        name: 'John',
        email: 'john@example.com',
      });
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.children.email.kind).toBe('value');
        expect(userStore.children.email.input.value).toBe('john@example.com');
        expect(userStore.children.email.isDirty.value).toBe(true);
      }
      expect(getFieldInput(userStore)).toStrictEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });
  });
});
