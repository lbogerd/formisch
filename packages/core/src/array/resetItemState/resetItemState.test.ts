// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { resetItemState } from './resetItemState.ts';

describe('resetItemState', () => {
  describe('value fields', () => {
    test('should reset value field to new input', () => {
      const store = createTestStore({ initialInput: { name: 'John' } });

      const nameStore = store.children.name;

      // Modify state
      expect(nameStore.kind).toBe('value');
      if (nameStore.kind === 'value') {
        nameStore.input.value = 'modified';
      }
      nameStore.isTouched.value = true;
      nameStore.isDirty.value = true;
      nameStore.errors.value = ['Error'];
      nameStore.elements = [document.createElement('input')];

      resetItemState(nameStore, 'reset-value');

      expect(nameStore.input.value).toBe('reset-value');
      expect(nameStore.startInput.value).toBe('reset-value');
      expect(nameStore.isTouched.value).toBe(false);
      expect(nameStore.isDirty.value).toBe(false);
      expect(nameStore.errors.value).toBe(null);
      expect(nameStore.elements).toEqual([]);
    });

    test('should handle undefined input', () => {
      const store = createTestStore({ initialInput: { name: 'John' } });

      const nameStore = store.children.name;
      expect(nameStore.kind).toBe('value');
      if (nameStore.kind === 'value') {
        nameStore.input.value = 'modified';
      }

      resetItemState(nameStore, undefined);

      expect(nameStore.input.value).toBe(undefined);
      expect(nameStore.startInput.value).toBe(undefined);
    });

    test('should keep initial input untouched', () => {
      const store = createTestStore({ initialInput: { name: 'John' } });

      const nameStore = store.children.name;

      resetItemState(nameStore, 'reset-value');

      expect(nameStore.initialInput.value).toBe('John');
      expect(nameStore.startInput.value).toBe('reset-value');
      expect(nameStore.input.value).toBe('reset-value');
    });
  });

  describe('object fields', () => {
    test('should reset object field and children', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John', age: 30 } },
      });

      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');

      if (userStore.kind === 'object') {
        // Modify state
        const childNameStore = userStore.children.name;
        expect(childNameStore.kind).toBe('value');
        if (childNameStore.kind === 'value') {
          childNameStore.input.value = 'modified';
        }
        childNameStore.isTouched.value = true;

        resetItemState(userStore, { name: 'Jane', age: 25 });

        expect(userStore.input.value).toBe(true);
        expect(userStore.startInput.value).toBe(true);
        expect(userStore.isTouched.value).toBe(false);
        expect(userStore.children.name.input.value).toBe('Jane');
        expect(userStore.children.name.isTouched.value).toBe(false);
        expect(userStore.children.age.input.value).toBe(25);
      }
    });

    test('should handle null input for object', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John' } },
      });

      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');

      if (userStore.kind === 'object') {
        resetItemState(userStore, null);

        expect(userStore.input.value).toBe(null);
        expect(userStore.startInput.value).toBe(null);
        expect(userStore.children.name.input.value).toBe(undefined);
      }
    });

    test('should initialize object children for unknown input keys', () => {
      const store = createTestStore({
        initialInput: { user: { name: 'John' } },
      });

      const userStore = store.children.user;
      expect(userStore.kind).toBe('object');

      if (userStore.kind === 'object') {
        expect(userStore.children.age).toBeUndefined();

        resetItemState(userStore, { name: 'Jane', age: 25 });

        expect(userStore.children.name.input.value).toBe('Jane');
        expect(userStore.children.age.input.value).toBe(25);
        expect(userStore.children.age.startInput.value).toBe(25);
        expect(userStore.children.age.isTouched.value).toBe(false);
      }
    });
  });

  describe('array fields', () => {
    test('should reset array field with new items', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');

      if (itemsStore.kind === 'array') {
        // Modify state
        itemsStore.children[0].isTouched.value = true;
        itemsStore.isTouched.value = true;

        resetItemState(itemsStore, ['x', 'y']);

        expect(itemsStore.input.value).toBe(true);
        expect(itemsStore.isTouched.value).toBe(false);
        expect(itemsStore.items.value.length).toBe(2);
        expect(itemsStore.startItems.value.length).toBe(2);
        expect(itemsStore.children[0].input.value).toBe('x');
        expect(itemsStore.children[0].isTouched.value).toBe(false);
        expect(itemsStore.children[1].input.value).toBe('y');
      }
    });

    test('should reset array to empty when input is null', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');

      if (itemsStore.kind === 'array') {
        resetItemState(itemsStore, null);

        expect(itemsStore.items.value).toEqual([]);
        expect(itemsStore.startItems.value).toEqual([]);
        expect(itemsStore.input.value).toBe(null);
      }
    });

    test('should generate new IDs for items', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');

      if (itemsStore.kind === 'array') {
        const originalId = itemsStore.items.value[0];

        resetItemState(itemsStore, ['new']);

        expect(itemsStore.items.value[0]).not.toBe(originalId);
      }
    });

    test('should initialize missing array children from input values', () => {
      const store = createTestStore({ initialInput: { items: ['a'] } });

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');

      if (itemsStore.kind === 'array') {
        expect(itemsStore.children.length).toBe(1);

        // Reset with more items than children exist
        resetItemState(itemsStore, ['x', 'y', 'z']);

        expect(itemsStore.items.value.length).toBe(3);
        expect(itemsStore.children.length).toBe(3);
        expect(itemsStore.children[0].input.value).toBe('x');
        expect(itemsStore.children[1].input.value).toBe('y');
        expect(itemsStore.children[1].startInput.value).toBe('y');
        expect(itemsStore.children[2].input.value).toBe('z');
      }
    });

    test('should keep initial input and initial items untouched', () => {
      const store = createTestStore({ initialInput: { items: ['a', 'b'] } });

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');

      if (itemsStore.kind === 'array') {
        const initialItems = itemsStore.initialItems.value;

        resetItemState(itemsStore, ['x', 'y', 'z']);

        expect(itemsStore.initialInput.value).toBe(true);
        expect(itemsStore.initialItems.value).toBe(initialItems);
        expect(itemsStore.items.value).not.toBe(initialItems);
        expect(itemsStore.children[0].initialInput.value).toBe('a');
        expect(itemsStore.children[0].input.value).toBe('x');
      }
    });
  });

  describe('value field upgrades', () => {
    test('should upgrade value store when reset with object input', () => {
      // A key with an `undefined` initial input creates a value store
      const store = createTestStore({ initialInput: { user: undefined } });

      const userStore = store.children.user;
      expect(userStore.kind).toBe('value');

      resetItemState(userStore, { name: 'Jane' });

      expect(userStore.kind).toBe('object');
      if (userStore.kind === 'object') {
        expect(userStore.input.value).toBe(true);
        expect(userStore.startInput.value).toBe(true);
        expect(userStore.children.name.input.value).toBe('Jane');
        expect(userStore.children.name.startInput.value).toBe('Jane');
      }
    });

    test('should upgrade value store when reset with array input', () => {
      // A key with an `undefined` initial input creates a value store
      const store = createTestStore({ initialInput: { items: undefined } });

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('value');

      resetItemState(itemsStore, ['x', 'y']);

      expect(itemsStore.kind).toBe('array');
      if (itemsStore.kind === 'array') {
        expect(itemsStore.input.value).toBe(true);
        expect(itemsStore.items.value.length).toBe(2);
        expect(itemsStore.startItems.value.length).toBe(2);
        expect(itemsStore.children[0].input.value).toBe('x');
        expect(itemsStore.children[1].input.value).toBe('y');
      }
    });
  });
});
