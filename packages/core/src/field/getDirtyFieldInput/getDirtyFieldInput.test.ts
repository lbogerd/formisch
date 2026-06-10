import { describe, expect, test } from 'vitest';
import { createTestStore } from '../../vitest/index.ts';
import { getDirtyFieldInput } from './getDirtyFieldInput.ts';

describe('getDirtyFieldInput', () => {
  test('should return undefined when no field is dirty', () => {
    const store = createTestStore({ initialInput: { name: 'John', age: 25 } });
    expect(getDirtyFieldInput(store)).toBeUndefined();
  });

  test('should omit clean siblings of a dirty value', () => {
    const store = createTestStore({
      initialInput: { name: 'John', email: 'a@example.com' },
    });
    const emailStore = store.children.email;
    expect(emailStore.kind).toBe('value');
    if (emailStore.kind === 'value') {
      emailStore.input.value = 'b@example.com';
      emailStore.isDirty.value = true;
    }
    expect(getDirtyFieldInput(store)).toStrictEqual({
      email: 'b@example.com',
    });
  });

  test('should return the full current array when any item is dirty', () => {
    const store = createTestStore({ initialInput: { items: ['a', 'b', 'c'] } });
    const itemsStore = store.children.items;
    expect(itemsStore.kind).toBe('array');
    if (itemsStore.kind === 'array') {
      const itemStore = itemsStore.children[1];
      expect(itemStore.kind).toBe('value');
      if (itemStore.kind === 'value') {
        itemStore.input.value = 'B';
        itemStore.isDirty.value = true;
      }
    }
    expect(getDirtyFieldInput(store)).toStrictEqual({
      items: ['a', 'B', 'c'],
    });
  });

  test('should include dirty leaves under a clean object parent', () => {
    const store = createTestStore({
      initialInput: { user: { email: 'a@example.com', name: 'John' } },
    });
    const userStore = store.children.user;
    expect(userStore.kind).toBe('object');
    if (userStore.kind === 'object') {
      const emailStore = userStore.children.email;
      expect(emailStore.kind).toBe('value');
      if (emailStore.kind === 'value') {
        emailStore.input.value = 'b@example.com';
        emailStore.isDirty.value = true;
      }
    }
    expect(getDirtyFieldInput(store)).toStrictEqual({
      user: { email: 'b@example.com' },
    });
  });

  test('should return undefined when called directly on a clean value field', () => {
    const store = createTestStore({ initialInput: { name: 'John' } });
    expect(getDirtyFieldInput(store.children.name)).toBeUndefined();
  });

  test('should return the value when called directly on a dirty value field', () => {
    const store = createTestStore({ initialInput: { name: 'John' } });
    const nameStore = store.children.name;
    expect(nameStore.kind).toBe('value');
    if (nameStore.kind === 'value') {
      nameStore.input.value = 'Jane';
      nameStore.isDirty.value = true;
    }
    expect(getDirtyFieldInput(store.children.name)).toBe('Jane');
  });
});
