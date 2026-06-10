import type {
  BaseFormStore,
  InternalFormStore,
  StandardSchemaV1,
} from '@formisch/core';
import { describe, expect, test } from 'vitest';
import { createTestStore } from '../vitest/index.ts';
import { swap } from './swap.ts';

/**
 * Creates a test store with a mock schema typed to the given input shape so
 * that field paths and initial inputs are type checked.
 *
 * @param initialInput The initial input of the form.
 *
 * @returns A form store for testing with access to internal state.
 */
function createTypedTestStore<TInput extends Record<string, unknown>>(
  initialInput?: TInput
): BaseFormStore<StandardSchemaV1<TInput>> & InternalFormStore {
  return createTestStore({ initialInput }) as BaseFormStore<
    StandardSchemaV1<TInput>
  > &
    InternalFormStore;
}

describe('swap', () => {
  test('should swap two items in array', () => {
    const store = createTypedTestStore({ items: ['a', 'b', 'c'] });

    swap(store, { path: ['items'], at: 0, and: 2 });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children[0].input.value).toBe('c');
      expect(itemsStore.children[1].input.value).toBe('b');
      expect(itemsStore.children[2].input.value).toBe('a');
    }
  });

  test('should swap adjacent items', () => {
    const store = createTypedTestStore({ items: ['a', 'b', 'c'] });

    swap(store, { path: ['items'], at: 0, and: 1 });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children[0].input.value).toBe('b');
      expect(itemsStore.children[1].input.value).toBe('a');
      expect(itemsStore.children[2].input.value).toBe('c');
    }
  });

  test('should not change array when swapping same index', () => {
    const store = createTypedTestStore({ items: ['a', 'b'] });

    swap(store, { path: ['items'], at: 0, and: 0 });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children[0].input.value).toBe('a');
      expect(itemsStore.children[1].input.value).toBe('b');
    }
  });

  test('should mark array as touched after swap', () => {
    const store = createTypedTestStore({ items: ['a', 'b'] });

    swap(store, { path: ['items'], at: 0, and: 1 });

    expect(store.children.items.isTouched.value).toBe(true);
  });

  test('should mark array as dirty after swap', () => {
    const store = createTypedTestStore({ items: ['a', 'b'] });

    swap(store, { path: ['items'], at: 0, and: 1 });

    expect(store.children.items.isDirty.value).toBe(true);
  });

  test('should swap object items correctly', () => {
    const store = createTypedTestStore({
      users: [{ name: 'John' }, { name: 'Jane' }],
    });

    swap(store, { path: ['users'], at: 0, and: 1 });

    const usersStore = store.children.users;
    expect(usersStore.kind).toBe('array');
    if (usersStore.kind === 'array') {
      const first = usersStore.children[0];
      const second = usersStore.children[1];
      expect(first.kind).toBe('object');
      expect(second.kind).toBe('object');
      if (first.kind === 'object' && second.kind === 'object') {
        expect(first.children.name.input.value).toBe('Jane');
        expect(second.children.name.input.value).toBe('John');
      }
    }
  });

  test('should swap object items with asymmetric children', () => {
    const store = createTypedTestStore<{
      users: { name: string; age?: number }[];
    }>({ users: [{ name: 'John' }, { name: 'Jane', age: 30 }] });

    swap(store, { path: ['users'], at: 0, and: 1 });

    const usersStore = store.children.users;
    expect(usersStore.kind).toBe('array');
    if (usersStore.kind === 'array') {
      const first = usersStore.children[0];
      const second = usersStore.children[1];
      expect(first.kind).toBe('object');
      expect(second.kind).toBe('object');
      if (first.kind === 'object' && second.kind === 'object') {
        expect(first.children.name.input.value).toBe('Jane');
        expect(second.children.name.input.value).toBe('John');
        // The 'age' child only existed in the second slot and must be
        // created in the first slot so that its state can be swapped
        expect(first.children.age).toBeDefined();
        expect(first.children.age.input.value).toBe(30);
        expect(second.children.age.input.value).toBeUndefined();
      }
    }
  });
});
