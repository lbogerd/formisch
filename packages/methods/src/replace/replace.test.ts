import type {
  BaseFormStore,
  InternalFormStore,
  StandardSchemaV1,
} from '@formisch/core';
import { describe, expect, test } from 'vitest';
import { createTestStore } from '../vitest/index.ts';
import { replace } from './replace.ts';

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

describe('replace', () => {
  test('should replace item in array', () => {
    const store = createTypedTestStore({ items: ['a', 'b', 'c'] });

    replace(store, { path: ['items'], at: 1, initialInput: 'x' });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children).toHaveLength(3);
      expect(itemsStore.children[0].input.value).toBe('a');
      expect(itemsStore.children[1].input.value).toBe('x');
      expect(itemsStore.children[2].input.value).toBe('c');
    }
  });

  test('should replace first item in array', () => {
    const store = createTypedTestStore({ items: ['a', 'b', 'c'] });

    replace(store, { path: ['items'], at: 0, initialInput: 'z' });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children[0].input.value).toBe('z');
    }
  });

  test('should replace last item in array', () => {
    const store = createTypedTestStore({ items: ['a', 'b'] });

    replace(store, { path: ['items'], at: 1, initialInput: 'z' });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children[1].input.value).toBe('z');
    }
  });

  test('should mark array as dirty after replace', () => {
    const store = createTypedTestStore({ items: ['a', 'b'] });

    replace(store, { path: ['items'], at: 0, initialInput: 'x' });

    expect(store.children.items.isDirty.value).toBe(true);
  });

  test('should replace with object item', () => {
    const store = createTypedTestStore({
      users: [{ name: 'John' }, { name: 'Jane' }],
    });

    replace(store, { path: ['users'], at: 0, initialInput: { name: 'Bob' } });

    const usersStore = store.children.users;
    expect(usersStore.kind).toBe('array');
    if (usersStore.kind === 'array') {
      const first = usersStore.children[0];
      expect(first.kind).toBe('object');
      if (first.kind === 'object') {
        expect(first.children.name.input.value).toBe('Bob');
      }
    }
  });

  test('should create missing children when replacing with richer object', () => {
    const store = createTypedTestStore<{
      users: { name: string; age?: number }[];
    }>({ users: [{ name: 'John' }] });

    replace(store, {
      path: ['users'],
      at: 0,
      initialInput: { name: 'Bob', age: 30 },
    });

    const usersStore = store.children.users;
    expect(usersStore.kind).toBe('array');
    if (usersStore.kind === 'array') {
      const first = usersStore.children[0];
      expect(first.kind).toBe('object');
      if (first.kind === 'object') {
        expect(first.children.name.input.value).toBe('Bob');
        // The 'age' child was not part of the slot's initial structure and
        // must be created by resetItemState
        expect(first.children.age).toBeDefined();
        expect(first.children.age.input.value).toBe(30);
      }
    }
  });

  test('should not change length when replacing', () => {
    const store = createTypedTestStore({ items: ['a', 'b', 'c'] });

    replace(store, { path: ['items'], at: 1, initialInput: 'x' });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children).toHaveLength(3);
    }
  });
});
