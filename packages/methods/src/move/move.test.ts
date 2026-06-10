import type {
  BaseFormStore,
  InternalFormStore,
  StandardSchemaV1,
} from '@formisch/core';
import { describe, expect, test } from 'vitest';
import { createTestStore } from '../vitest/index.ts';
import { move } from './move.ts';

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

describe('move', () => {
  test('should move item forward in array', () => {
    const store = createTypedTestStore({ items: ['a', 'b', 'c'] });

    move(store, { path: ['items'], from: 0, to: 2 });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children[0].input.value).toBe('b');
      expect(itemsStore.children[1].input.value).toBe('c');
      expect(itemsStore.children[2].input.value).toBe('a');
    }
  });

  test('should move item backward in array', () => {
    const store = createTypedTestStore({ items: ['a', 'b', 'c'] });

    move(store, { path: ['items'], from: 2, to: 0 });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children[0].input.value).toBe('c');
      expect(itemsStore.children[1].input.value).toBe('a');
      expect(itemsStore.children[2].input.value).toBe('b');
    }
  });

  test('should not change array when from equals to', () => {
    const store = createTypedTestStore({ items: ['a', 'b', 'c'] });

    move(store, { path: ['items'], from: 1, to: 1 });

    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      expect(itemsStore.children[0].input.value).toBe('a');
      expect(itemsStore.children[1].input.value).toBe('b');
      expect(itemsStore.children[2].input.value).toBe('c');
    }
  });

  test('should mark array as touched after move', () => {
    const store = createTypedTestStore({ items: ['a', 'b'] });

    move(store, { path: ['items'], from: 0, to: 1 });

    expect(store.children.items.isTouched.value).toBe(true);
  });

  test('should mark array as dirty after move', () => {
    const store = createTypedTestStore({ items: ['a', 'b'] });

    move(store, { path: ['items'], from: 0, to: 1 });

    expect(store.children.items.isDirty.value).toBe(true);
  });

  test('should move object items correctly', () => {
    const store = createTypedTestStore({
      users: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
    });

    move(store, { path: ['users'], from: 0, to: 2 });

    const usersStore = store.children.users;
    expect(usersStore.kind).toBe('array');
    if (usersStore.kind === 'array') {
      const first = usersStore.children[0];
      const third = usersStore.children[2];
      expect(first.kind).toBe('object');
      expect(third.kind).toBe('object');
      if (first.kind === 'object' && third.kind === 'object') {
        expect(first.children.name.input.value).toBe('B');
        expect(third.children.name.input.value).toBe('A');
      }
    }
  });

  test('should move in nested array', () => {
    const store = createTypedTestStore({ data: { tags: ['x', 'y', 'z'] } });

    move(store, { path: ['data', 'tags'], from: 2, to: 0 });

    const dataStore = store.children.data;
    expect(dataStore.kind).toBe('object');
    if (dataStore.kind === 'object') {
      const tagsStore = dataStore.children.tags;
      expect(tagsStore.kind).toBe('array');
      if (tagsStore.kind === 'array') {
        expect(tagsStore.children[0].input.value).toBe('z');
        expect(tagsStore.children[1].input.value).toBe('x');
        expect(tagsStore.children[2].input.value).toBe('y');
      }
    }
  });
});
