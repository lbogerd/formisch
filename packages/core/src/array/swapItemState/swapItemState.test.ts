// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { swapItemState } from './swapItemState.ts';

describe('swapItemState', () => {
  describe('value fields', () => {
    test('should swap basic state between value fields', () => {
      const store = createTestStore({
        initialInput: { first: 'hello', second: 'world' },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      firstStore.isTouched.value = true;
      firstStore.errors.value = ['First error'];
      secondStore.isDirty.value = true;

      swapItemState(firstStore, secondStore);

      expect(firstStore.input.value).toBe('world');
      expect(secondStore.input.value).toBe('hello');
      expect(firstStore.isTouched.value).toBe(false);
      expect(secondStore.isTouched.value).toBe(true);
      expect(firstStore.isDirty.value).toBe(true);
      expect(secondStore.isDirty.value).toBe(false);
      expect(firstStore.errors.value).toBe(null);
      expect(secondStore.errors.value).toEqual(['First error']);
    });

    test('should swap elements arrays', () => {
      const store = createTestStore({
        initialInput: { first: '', second: '' },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      const input1 = document.createElement('input');
      const input2 = document.createElement('input');
      firstStore.elements = [input1];
      secondStore.elements = [input2];

      swapItemState(firstStore, secondStore);

      expect(firstStore.elements).toEqual([input2]);
      expect(secondStore.elements).toEqual([input1]);
    });
  });

  describe('object fields', () => {
    test('should swap nested object state recursively', () => {
      const store = createTestStore({
        initialInput: {
          first: { name: 'John' },
          second: { name: 'Jane' },
        },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      expect(firstStore.kind).toBe('object');
      expect(secondStore.kind).toBe('object');

      if (firstStore.kind === 'object' && secondStore.kind === 'object') {
        firstStore.children.name.isTouched.value = true;

        swapItemState(firstStore, secondStore);

        expect(firstStore.children.name.input.value).toBe('Jane');
        expect(secondStore.children.name.input.value).toBe('John');
        expect(firstStore.children.name.isTouched.value).toBe(false);
        expect(secondStore.children.name.isTouched.value).toBe(true);
      }
    });

    test('should swap asymmetric object children in both directions', () => {
      const store = createTestStore({
        initialInput: {
          first: { name: 'John', email: 'john@example.com' },
          second: { name: 'Jane', phone: '123' },
        },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      expect(firstStore.kind).toBe('object');
      expect(secondStore.kind).toBe('object');

      if (firstStore.kind === 'object' && secondStore.kind === 'object') {
        expect(firstStore.children.phone).toBeUndefined();
        expect(secondStore.children.email).toBeUndefined();

        swapItemState(firstStore, secondStore);

        // Key only present on first side swaps over to second
        expect(firstStore.children.email.input.value).toBe(undefined);
        expect(secondStore.children.email.input.value).toBe('john@example.com');

        // Key only present on second side swaps over to first
        expect(firstStore.children.phone.input.value).toBe('123');
        expect(secondStore.children.phone.input.value).toBe(undefined);

        // Shared keys are swapped as usual
        expect(firstStore.children.name.input.value).toBe('Jane');
        expect(secondStore.children.name.input.value).toBe('John');
      }
    });
  });

  describe('array fields', () => {
    test('should swap array state including items', () => {
      const store = createTestStore({
        initialInput: {
          first: ['a', 'b'],
          second: ['x', 'y', 'z'],
        },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      expect(firstStore.kind).toBe('array');
      expect(secondStore.kind).toBe('array');

      if (firstStore.kind === 'array' && secondStore.kind === 'array') {
        const firstItems = firstStore.items.value;
        const secondItems = secondStore.items.value;

        swapItemState(firstStore, secondStore);

        expect(firstStore.items.value).toEqual(secondItems);
        expect(secondStore.items.value).toEqual(firstItems);
        expect(firstStore.children[0].input.value).toBe('x');
        expect(secondStore.children[0].input.value).toBe('a');
      }
    });

    test('should initialize missing children in first array when second has more items', () => {
      const store = createTestStore({
        initialInput: {
          first: ['a'],
          second: ['x', 'y', 'z'],
        },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      expect(firstStore.kind).toBe('array');
      expect(secondStore.kind).toBe('array');

      if (firstStore.kind === 'array' && secondStore.kind === 'array') {
        expect(firstStore.children.length).toBe(1);
        expect(secondStore.children.length).toBe(3);

        swapItemState(firstStore, secondStore);

        // Both should now have 3 children (max of both)
        expect(firstStore.children.length).toBe(3);
        expect(secondStore.children.length).toBe(3);
      }
    });

    test('should initialize missing children in second array when first has more items', () => {
      const store = createTestStore({
        initialInput: {
          first: ['a', 'b', 'c'],
          second: ['x'],
        },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      expect(firstStore.kind).toBe('array');
      expect(secondStore.kind).toBe('array');

      if (firstStore.kind === 'array' && secondStore.kind === 'array') {
        expect(firstStore.children.length).toBe(3);
        expect(secondStore.children.length).toBe(1);

        swapItemState(firstStore, secondStore);

        // Both should now have 3 children (max of both)
        expect(firstStore.children.length).toBe(3);
        expect(secondStore.children.length).toBe(3);
        expect(firstStore.children[0].input.value).toBe('x');
        expect(secondStore.children[0].input.value).toBe('a');
      }
    });
  });

  describe('value field upgrades', () => {
    test('should upgrade lazily created value store when swapping with object store', () => {
      // A key with an `undefined` initial input creates a value store
      const store = createTestStore({
        initialInput: {
          first: { name: 'John' },
          second: undefined,
        },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      expect(firstStore.kind).toBe('object');
      expect(secondStore.kind).toBe('value');

      swapItemState(firstStore, secondStore);

      expect(secondStore.kind).toBe('object');
      if (firstStore.kind === 'object' && secondStore.kind === 'object') {
        expect(firstStore.input.value).toBe(undefined);
        expect(secondStore.input.value).toBe(true);
        expect(firstStore.children.name.input.value).toBe(undefined);
        expect(secondStore.children.name.input.value).toBe('John');
      }
    });

    test('should upgrade lazily created value store when swapping with array store', () => {
      // A key with an `undefined` initial input creates a value store
      const store = createTestStore({
        initialInput: {
          first: undefined,
          second: ['x', 'y'],
        },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      expect(firstStore.kind).toBe('value');
      expect(secondStore.kind).toBe('array');

      swapItemState(firstStore, secondStore);

      expect(firstStore.kind).toBe('array');
      if (firstStore.kind === 'array' && secondStore.kind === 'array') {
        expect(firstStore.input.value).toBe(true);
        expect(secondStore.input.value).toBe(undefined);
        expect(firstStore.items.value.length).toBe(2);
        expect(secondStore.items.value.length).toBe(0);
        expect(firstStore.children[0].input.value).toBe('x');
        expect(firstStore.children[1].input.value).toBe('y');
        expect(secondStore.children[0].input.value).toBe(undefined);
      }
    });
  });

  describe('edge cases', () => {
    test('should handle swapping startInput values', () => {
      const store = createTestStore({
        initialInput: { first: 'start-first', second: 'start-second' },
      });

      const firstStore = store.children.first;
      const secondStore = store.children.second;

      swapItemState(firstStore, secondStore);

      expect(firstStore.startInput.value).toBe('start-second');
      expect(secondStore.startInput.value).toBe('start-first');
    });

    test('should swap nested objects within array items', () => {
      const store = createTestStore({
        initialInput: {
          items: [
            { name: 'Alice', score: 100 },
            { name: 'Bob', score: 50 },
          ],
        },
      });

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');

      if (itemsStore.kind === 'array') {
        const child0 = itemsStore.children[0];
        const child1 = itemsStore.children[1];

        expect(child0.kind).toBe('object');
        expect(child1.kind).toBe('object');

        if (child0.kind === 'object' && child1.kind === 'object') {
          child0.children.name.isTouched.value = true;

          swapItemState(child0, child1);

          expect(child0.children.name.input.value).toBe('Bob');
          expect(child0.children.score.input.value).toBe(50);
          expect(child1.children.name.input.value).toBe('Alice');
          expect(child1.children.score.input.value).toBe(100);
          expect(child0.children.name.isTouched.value).toBe(false);
          expect(child1.children.name.isTouched.value).toBe(true);
        }
      }
    });

    test('should swap items within same array (typical array reorder use case)', () => {
      const store = createTestStore({
        initialInput: { items: ['first', 'second', 'third'] },
      });

      const itemsStore = store.children.items;
      expect(itemsStore.kind).toBe('array');

      if (itemsStore.kind === 'array') {
        const child0 = itemsStore.children[0];
        const child2 = itemsStore.children[2];

        child0.isTouched.value = true;

        swapItemState(child0, child2);

        expect(child0.input.value).toBe('third');
        expect(child2.input.value).toBe('first');
        expect(child0.isTouched.value).toBe(false);
        expect(child2.isTouched.value).toBe(true);
      }
    });
  });
});
