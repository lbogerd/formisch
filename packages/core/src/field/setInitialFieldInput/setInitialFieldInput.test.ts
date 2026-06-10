import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { setInitialFieldInput } from './setInitialFieldInput.ts';

describe('setInitialFieldInput', () => {
  describe('value fields', () => {
    test('should set initial input', () => {
      const store = createTestStore({ initialInput: { name: undefined } });
      setInitialFieldInput(store.children.name, 'John');
      expect(store.children.name.initialInput.value).toBe('John');
    });

    test('should not change current input', () => {
      const store = createTestStore({ initialInput: { name: 'John' } });
      setInitialFieldInput(store.children.name, 'Jane');
      expect(store.children.name.initialInput.value).toBe('Jane');
      expect(store.children.name.input.value).toBe('John');
    });
  });

  describe('object fields', () => {
    test('should set initial input on nested children', () => {
      const store = createTestStore({
        initialInput: { user: { name: undefined } },
      });
      setInitialFieldInput(store.children.user, { name: 'John' });
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.children.name.initialInput.value).toBe('John');
      }
    });

    test('should set null input for nullish object', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John' } },
      });
      setInitialFieldInput(store.children.user, null);
      expect(store.children.user.input.value).toBeNull();
    });

    test('should create children for unknown initial input keys', () => {
      const store = createTestStore({
        initialInput: { user: { name: undefined } },
      });
      setInitialFieldInput(store.children.user, {
        name: 'John',
        email: 'john@example.com',
      });
      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.children.email.kind).toBe('value');
        expect(userStore.children.email.initialInput.value).toBe(
          'john@example.com'
        );
      }
    });
  });

  describe('array fields', () => {
    test('should set initial items', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });
      setInitialFieldInput(store.children.items, ['x', 'y']);
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.initialItems.value).toHaveLength(2);
      }
    });

    test('should initialize new children from value when array grows', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });
      setInitialFieldInput(store.children.items, ['x', 'y', 'z']);
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.children).toHaveLength(3);
        expect(itemsStore.children[1].kind).toBe('value');
        expect(itemsStore.children[2].initialInput.value).toBe('z');
      }
    });

    test('should initialize new composite children when array grows', () => {
      const store = createTestStore({
        initialInput: { users: [{ name: 'John' }] },
      });
      setInitialFieldInput(store.children.users, [
        { name: 'Jane' },
        { name: 'Janet' },
      ]);
      const usersStore = store.children.users;
      expect(usersStore.kind).toBe('array');
      if (usersStore.kind === 'array') {
        expect(usersStore.children).toHaveLength(2);
        const userStore = usersStore.children[1];
        expect(userStore.kind).toBe('object');
        if (userStore.kind === 'object') {
          expect(userStore.children.name.initialInput.value).toBe('Janet');
        }
      }
    });

    test('should set null input for nullish array', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });
      setInitialFieldInput(store.children.items, null);
      expect(store.children.items.input.value).toBeNull();
      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.initialItems.value).toHaveLength(0);
      }
    });

    test('should set initial input on existing children', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });
      const itemsStore = store.children.items;
      setInitialFieldInput(itemsStore, ['x', 'y']);
      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.children[0].initialInput.value).toBe('x');
        expect(itemsStore.children[1].initialInput.value).toBe('y');
      }
    });
  });

  describe('value store upgrades', () => {
    test('should upgrade value store to object store for object initial input', () => {
      const store = createTestStore({ initialInput: { profile: undefined } });
      expect(store.children.profile.kind).toBe('value');
      setInitialFieldInput(store.children.profile, { bio: 'Hello' });
      const profileStore = store.children.profile;
      expect(profileStore.kind).toBe('object');
      expect(profileStore.input.value).toBe(true);
      if (profileStore.kind === 'object') {
        expect(profileStore.children.bio.kind).toBe('value');
        expect(profileStore.children.bio.initialInput.value).toBe('Hello');
      }
    });

    test('should upgrade value store to array store for array initial input', () => {
      const store = createTestStore({ initialInput: { tags: null } });
      expect(store.children.tags.kind).toBe('value');
      setInitialFieldInput(store.children.tags, ['a', 'b']);
      const tagsStore = store.children.tags;
      expect(tagsStore.kind).toBe('array');
      expect(tagsStore.input.value).toBe(true);
      if (tagsStore.kind === 'array') {
        expect(tagsStore.children).toHaveLength(2);
        expect(tagsStore.initialItems.value).toHaveLength(2);
        expect(tagsStore.children[0].initialInput.value).toBe('a');
        expect(tagsStore.children[1].initialInput.value).toBe('b');
      }
    });
  });
});
